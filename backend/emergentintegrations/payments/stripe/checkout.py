"""
Stripe Checkout Session Implementation
Compatible with emergentintegrations API
"""
import stripe
from pydantic import BaseModel
from typing import Optional, Dict, Any


class CheckoutSessionRequest(BaseModel):
    """Request model for creating a checkout session"""
    amount: float
    currency: str = "usd"
    success_url: str
    cancel_url: str
    metadata: Optional[Dict[str, str]] = None
    customer_email: Optional[str] = None


class CheckoutSessionResponse(BaseModel):
    """Response model for checkout session"""
    session_id: str
    url: str
    status: str


class CheckoutStatus(BaseModel):
    """Status model for checkout session"""
    status: str
    payment_status: str
    amount_total: float
    currency: str
    metadata: Optional[Dict[str, Any]] = None


class WebhookResponse(BaseModel):
    """Response model for webhook handling"""
    event_type: str
    session_id: Optional[str] = None
    payment_status: Optional[str] = None
    status: str


class StripeCheckout:
    """
    Stripe Checkout integration for HWH Player Advantage
    """
    
    def __init__(self, api_key: str, webhook_url: str = ""):
        """
        Initialize Stripe checkout
        
        Args:
            api_key: Stripe secret key (sk_test_... or sk_live_...)
            webhook_url: URL for webhook events (optional)
        """
        self.api_key = api_key
        self.webhook_url = webhook_url
        stripe.api_key = api_key
    
    async def create_checkout_session(self, request: CheckoutSessionRequest) -> CheckoutSessionResponse:
        """
        Create a new Stripe checkout session
        
        Args:
            request: CheckoutSessionRequest with payment details
            
        Returns:
            CheckoutSessionResponse with session ID and checkout URL
        """
        try:
            # Convert amount to cents for Stripe
            amount_cents = int(request.amount * 100)
            
            # Create line items for the session
            line_items = [{
                "price_data": {
                    "currency": request.currency.lower(),
                    "product_data": {
                        "name": "HWH Player Advantage Package",
                        "description": f"Package: {request.metadata.get('package', 'standard') if request.metadata else 'standard'}"
                    },
                    "unit_amount": amount_cents
                },
                "quantity": 1
            }]
            
            # Create the checkout session
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=line_items,
                mode='payment',
                success_url=request.success_url,
                cancel_url=request.cancel_url,
                metadata=request.metadata or {},
                customer_email=request.customer_email,
                automatic_tax={'enabled': False},
                billing_address_collection='required',
                shipping_address_collection=None,
                allow_promotion_codes=True
            )
            
            return CheckoutSessionResponse(
                session_id=session.id,
                url=session.url,
                status=session.status
            )
            
        except stripe.error.StripeError as e:
            raise Exception(f"Stripe error: {str(e)}")
        except Exception as e:
            raise Exception(f"Failed to create checkout session: {str(e)}")
    
    async def get_checkout_status(self, session_id: str) -> CheckoutStatus:
        """
        Get the status of a checkout session
        
        Args:
            session_id: Stripe checkout session ID
            
        Returns:
            CheckoutStatus with payment status and details
        """
        try:
            session = stripe.checkout.Session.retrieve(session_id)
            
            # Get the payment status
            payment_status = session.payment_status  # 'paid', 'unpaid', or 'no_payment_required'
            
            # Calculate amount in dollars
            amount_total = (session.amount_total or 0) / 100
            
            return CheckoutStatus(
                status=session.status,
                payment_status=payment_status,
                amount_total=amount_total,
                currency=session.currency,
                metadata=session.metadata
            )
            
        except stripe.error.StripeError as e:
            raise Exception(f"Stripe error: {str(e)}")
        except Exception as e:
            raise Exception(f"Failed to get checkout status: {str(e)}")
    
    async def handle_webhook(self, body: bytes, signature: Optional[str] = None) -> WebhookResponse:
        """
        Handle Stripe webhook events
        
        Args:
            body: Raw request body from webhook
            signature: Stripe-Signature header value
            
        Returns:
            WebhookResponse with event details
        """
        try:
            # Parse the event
            event = stripe.Event.construct_from(
                json.loads(body), stripe.api_key
            )
            
            event_type = event.type
            session_id = None
            payment_status = None
            
            # Handle checkout session completed
            if event_type == 'checkout.session.completed':
                session = event.data.object
                session_id = session.id
                payment_status = session.payment_status
                
            # Handle payment succeeded
            elif event_type == 'payment_intent.succeeded':
                payment_intent = event.data.object
                session_id = payment_intent.metadata.get('session_id')
                payment_status = 'paid'
                
            # Handle payment failed
            elif event_type == 'payment_intent.payment_failed':
                payment_intent = event.data.object
                session_id = payment_intent.metadata.get('session_id')
                payment_status = 'failed'
            
            return WebhookResponse(
                event_type=event_type,
                session_id=session_id,
                payment_status=payment_status,
                status='received'
            )
            
        except Exception as e:
            return WebhookResponse(
                event_type='error',
                status=f'error: {str(e)}'
            )


# Import json for webhook handling
import json
