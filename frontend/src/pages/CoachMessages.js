import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useCoachAuth } from '../context/CoachAuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { 
  ArrowLeft, Loader2, Send, Mail, MailOpen, User,
  Clock, Crown, Lock, Users, Search, Building2
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function CoachMessages() {
  const { getAuthHeaders } = useCoachAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [activeTab, setActiveTab] = useState('inbox');
  const [showCompose, setShowCompose] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Compose form
  const [recipientType, setRecipientType] = useState('hwh');
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  
  // Elite coaches list
  const [eliteCoaches, setEliteCoaches] = useState([]);
  const [coachSearch, setCoachSearch] = useState('');
  const [loadingCoaches, setLoadingCoaches] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/coach/messages?type=${activeTab}`, {
        headers: getAuthHeaders()
      });
      setMessages(response.data.messages);
      setHasAccess(true);
    } catch (error) {
      if (error.response?.status === 403) {
        setHasAccess(false);
      } else {
        toast.error('Failed to load messages');
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab, getAuthHeaders]);

  const fetchEliteCoaches = async (search = '') => {
    setLoadingCoaches(true);
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const response = await axios.get(`${API_URL}/api/coach/elite-coaches${params}`, {
        headers: getAuthHeaders()
      });
      setEliteCoaches(response.data.coaches);
    } catch (error) {
      console.error('Failed to load coaches');
      setEliteCoaches([]);
    } finally {
      setLoadingCoaches(false);
    }
  };

  const openCompose = () => {
    setShowCompose(true);
    setRecipientType('hwh');
    setSelectedCoach(null);
    setSubject('');
    setMessage('');
    fetchEliteCoaches();
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill in subject and message');
      return;
    }
    
    if (recipientType === 'coach' && !selectedCoach) {
      toast.error('Please select a coach to message');
      return;
    }

    setSending(true);
    try {
      await axios.post(
        `${API_URL}/api/coach/messages`,
        {
          recipient_type: recipientType,
          recipient_id: recipientType === 'coach' ? selectedCoach.id : null,
          subject,
          message
        },
        { headers: getAuthHeaders() }
      );
      
      toast.success('Message sent successfully!');
      setShowCompose(false);
      setSubject('');
      setMessage('');
      setSelectedCoach(null);
      if (activeTab === 'sent') {
        fetchMessages();
      }
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to send message';
      toast.error(errorMsg);
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async (messageId) => {
    try {
      await axios.patch(
        `${API_URL}/api/coach/messages/${messageId}/read`,
        {},
        { headers: getAuthHeaders() }
      );
      setMessages(prev => 
        prev.map(m => m.id === messageId ? { ...m, read: true } : m)
      );
    } catch (error) {
      console.error('Failed to mark as read');
    }
  };

  if (!hasAccess && !loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0b]">
        <header className="sticky top-0 z-40 bg-[#121212]/80 backdrop-blur-md border-b border-white/10">
          <div className="max-w-4xl mx-auto px-4 lg:px-8 py-4 flex items-center gap-4">
            <Link to="/coach">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="font-heading text-2xl font-bold uppercase text-white">Messages</h1>
          </div>
        </header>
        
        <main className="max-w-4xl mx-auto px-4 lg:px-8 py-16">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-[#fb6c1d]/20 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-[#fb6c1d]" />
            </div>
            <h2 className="font-heading text-3xl font-bold uppercase text-white mb-4">
              Elite Feature
            </h2>
            <p className="text-white/60 max-w-md mx-auto mb-8">
              Direct messaging is available exclusively for Elite subscribers. 
              Upgrade to communicate directly with Hoop With Her and other Elite coaches.
            </p>
            <Link to="/coach/subscription">
              <Button className="btn-secondary">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Elite
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0b0b]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#121212]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/coach">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="font-heading text-2xl font-bold uppercase text-white">Messages</h1>
          </div>
          
          <Button 
            onClick={openCompose}
            className="btn-secondary"
            data-testid="compose-message-btn"
          >
            <Send className="w-4 h-4 mr-2" />
            Compose
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'inbox' 
                ? 'bg-[#0134bd] text-white' 
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <Mail className="w-4 h-4 inline mr-2" />
            Inbox
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'sent' 
                ? 'bg-[#0134bd] text-white' 
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <Send className="w-4 h-4 inline mr-2" />
            Sent
          </button>
        </div>

        {/* Compose Modal */}
        {showCompose && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-white/10">
                <h2 className="font-heading text-xl font-bold uppercase text-white">
                  New Message
                </h2>
                <p className="text-white/50 text-sm mt-1">
                  Send to Hoop With Her or another Elite coach
                </p>
              </div>
              
              <form onSubmit={handleSend} className="p-6 space-y-4">
                {/* Recipient Type */}
                <div className="space-y-2">
                  <Label>Send To</Label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRecipientType('hwh');
                        setSelectedCoach(null);
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                        recipientType === 'hwh'
                          ? 'bg-[#0134bd] border-[#0134bd] text-white'
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                      Hoop With Her
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecipientType('coach')}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                        recipientType === 'coach'
                          ? 'bg-[#fb6c1d] border-[#fb6c1d] text-white'
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      Elite Coach
                    </button>
                  </div>
                </div>
                
                {/* Coach Selection */}
                {recipientType === 'coach' && (
                  <div className="space-y-2">
                    <Label>Select Coach</Label>
                    {selectedCoach ? (
                      <div className="flex items-center justify-between bg-[#fb6c1d]/10 border border-[#fb6c1d]/30 rounded-lg p-3">
                        <div>
                          <p className="font-medium text-white">{selectedCoach.name}</p>
                          <p className="text-sm text-white/60">{selectedCoach.school}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedCoach(null)}
                        >
                          Change
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                          <Input
                            value={coachSearch}
                            onChange={(e) => {
                              setCoachSearch(e.target.value);
                              fetchEliteCoaches(e.target.value);
                            }}
                            className="input-dark pl-10"
                            placeholder="Search coaches by name or school..."
                          />
                        </div>
                        <div className="max-h-40 overflow-y-auto bg-white/5 rounded-lg border border-white/10">
                          {loadingCoaches ? (
                            <div className="p-4 text-center">
                              <Loader2 className="w-5 h-5 animate-spin mx-auto text-white/40" />
                            </div>
                          ) : eliteCoaches.length === 0 ? (
                            <div className="p-4 text-center text-white/40 text-sm">
                              No Elite coaches found
                            </div>
                          ) : (
                            eliteCoaches.map(coach => (
                              <button
                                key={coach.id}
                                type="button"
                                onClick={() => setSelectedCoach(coach)}
                                className="w-full p-3 text-left hover:bg-white/10 border-b border-white/5 last:border-0 transition-colors"
                              >
                                <p className="font-medium text-white">{coach.name}</p>
                                <p className="text-sm text-white/50">{coach.school} {coach.state && `• ${coach.state}`}</p>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    data-testid="message-subject-input"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="input-dark"
                    placeholder="e.g., Request for Coach Referral"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    data-testid="message-body-input"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="input-dark min-h-[150px]"
                    placeholder="Type your message..."
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowCompose(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={sending || (recipientType === 'coach' && !selectedCoach)}
                    data-testid="send-message-btn"
                    className="btn-secondary flex-1"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Messages List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#fb6c1d] animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20">
            <Mail className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/50">No messages yet</p>
            <p className="text-white/30 text-sm mt-2">
              Start a conversation with Hoop With Her or another Elite coach
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map(msg => (
              <div
                key={msg.id}
                onClick={() => !msg.read && activeTab === 'inbox' && markAsRead(msg.id)}
                className={`bg-[#121212] border rounded-xl p-4 cursor-pointer transition-colors ${
                  msg.read || activeTab === 'sent'
                    ? 'border-white/10 hover:border-white/20'
                    : 'border-[#fb6c1d]/30 bg-[#fb6c1d]/5'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      msg.read || activeTab === 'sent' ? 'bg-white/10' : 'bg-[#fb6c1d]/20'
                    }`}>
                      {msg.read || activeTab === 'sent' ? (
                        <MailOpen className="w-5 h-5 text-white/50" />
                      ) : (
                        <Mail className="w-5 h-5 text-[#fb6c1d]" />
                      )}
                    </div>
                    <div>
                      {/* Sender/Recipient Info */}
                      {activeTab === 'inbox' && msg.sender_name && (
                        <p className="text-sm text-[#fb6c1d] mb-1">
                          From: {msg.sender_name} {msg.sender_school && `(${msg.sender_school})`}
                        </p>
                      )}
                      <h3 className="font-medium text-white">{msg.subject}</h3>
                      <p className="text-white/60 text-sm mt-1 line-clamp-2">
                        {msg.message}
                      </p>
                      {msg.player && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          <User className="w-3 h-3 mr-1" />
                          Re: {msg.player.player_name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-white/40 text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(msg.created_at).toLocaleDateString()}
                    </div>
                    {activeTab === 'sent' && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        {msg.recipient_type === 'hwh' ? 'To: HWH' : 'To: Coach'}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
