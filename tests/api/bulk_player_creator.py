#!/usr/bin/env python3
"""
Elite GBB Bulk Player Creator
===============================
Create multiple test players quickly for load testing and database population.

Features:
    - Create 1-1000+ random players
    - Import from CSV file
    - Progress tracking and statistics
    - JSON output of created players

Updated for Elite GBB schema with correct column names and port 8790.

Usage:
    python3 bulk_player_creator.py --count 50
    python3 bulk_player_creator.py --csv ../data/sample_players.csv
    python3 bulk_player_creator.py --count 100 --package standard --output my_players.json
"""

import requests
import json
import random
import string
import time
import csv
import argparse
import sys
from datetime import datetime
from typing import Dict, List, Any, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed

# Configuration
DEFAULT_HOST = "http://localhost:8790"
API_BASE = "/api"

# Player data pools
FIRST_NAMES = [
    "Emma", "Olivia", "Ava", "Isabella", "Sophia", "Mia", "Charlotte", "Amelia", "Evelyn", "Abigail",
    "Liam", "Noah", "Oliver", "Elijah", "William", "James", "Benjamin", "Lucas", "Henry", "Alexander",
    "Zoe", "Nora", "Lily", "Grace", "Victoria", "Riley", "Aria", "Zoey", "Leah", "Audrey",
    "Mason", "Ethan", "Logan", "Jackson", "Sebastian", "Jack", "Aiden", "Owen", "Samuel", "Matthew"
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
    "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
    "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
    "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores"
]

SCHOOLS = [
    "Lakeside High School", "North Atlanta Academy", "South Cobb High", "West Forsyth School",
    "East Paulding High", "Central Gwinnett Academy", "Milton High School", "Alpharetta High",
    "Roswell High", "Johns Creek Academy", "Duluth High School", "Norcross Academy",
    "Parkview High School", "Brookwood Academy", "Grayson High", "Archer High School",
    "Collins Hill High", "Mountain View Academy", "Peachtree Ridge", "North Gwinnett High",
    "Marist School", "Westminster Academy", "Lovett High School", "Pace Academy",
    "Woodward Academy", "Holy Innocents'", "St. Pius X", "Greater Atlanta Christian",
    "Wesleyan School", "Mount Vernon Presbyterian"
]

CITIES = [
    "Atlanta", "Alpharetta", "Marietta", "Roswell", "Johns Creek", "Sandy Springs",
    "Duluth", "Norcross", "Lawrenceville", "Snellville", "Loganville", "Grayson",
    "Lilburn", "Stone Mountain", "Decatur", "Dunwoody", "Brookhaven", "Buckhead",
    "Midtown", "Virginia Highland", "Candler Park", "East Atlanta", "Inman Park",
    "Little Five Points", "Grant Park", "Old Fourth Ward", "Poncey-Highland", "Virginia-Highland"
]

STATES = ["GA"]  # Primary state for Elite GBB

POSITIONS = ["PG", "SG", "SF", "PF", "C", "G", "F"]

HEIGHTS = ["5'2\"", "5'3\"", "5'4\"", "5'5\"", "5'6\"", "5'7\"", "5'8\"", "5'9\"", "5'10\"", "5'11\"",
           "6'0\"", "6'1\"", "6'2\"", "6'3\"", "6'4\"", "6'5\"", "6'6\"", "6'7\"", "6'8\""]


class BulkPlayerCreator:
    """Bulk player creator for Elite GBB"""

    def __init__(self, host: str = DEFAULT_HOST, verbose: bool = False):
        self.host = host.rstrip('/')
        self.base_url = f"{self.host}{API_BASE}"
        self.verbose = verbose
        self.created_players: List[Dict[str, Any]] = []
        self.failed_requests: List[Dict[str, Any]] = []
        self.stats = {
            "total": 0,
            "success": 0,
            "failed": 0,
            "start_time": None,
            "end_time": None
        }

    def log(self, message: str):
        """Print message if verbose mode is on"""
        if self.verbose:
            print(message)

    def generate_name(self) -> tuple:
        """Generate random player name"""
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        return f"{first} {last}", first, last

    def generate_dob(self, grad_class: int) -> str:
        """Generate realistic date of birth based on graduation year"""
        age_at_grad = 18 if grad_class == 2025 else 17 if grad_class == 2026 else 16 if grad_class == 2027 else 15 if grad_class == 2028 else 14
        birth_year = 2025 - age_at_grad
        birth_month = random.randint(1, 12)
        birth_day = random.randint(1, 28)
        return f"{birth_year}-{birth_month:02d}-{birth_day:02d}"

    def generate_player_data(self, package: str = "free", overrides: Dict = None) -> Dict[str, Any]:
        """Generate a single player's data"""
        full_name, first, last = self.generate_name()
        grad_class = random.choice([2025, 2026, 2027, 2028, 2029])
        gender = random.choice(["Male", "Female"])
        city = random.choice(CITIES)
        state = "GA"
        
        player = {
            "player_name": full_name,
            "preferred_name": first if random.random() > 0.7 else None,
            "instagram_handle": f"@{first.lower()}{last.lower()}{random.randint(1, 99)}" if random.random() > 0.3 else None,
            "dob": self.generate_dob(grad_class),
            "grad_class": str(grad_class),
            "gender": gender,
            "school": random.choice(SCHOOLS),
            "city": city,
            "state": state,
            "primary_position": random.choice(POSITIONS),
            "secondary_position": random.choice(POSITIONS) if random.random() > 0.6 else None,
            "jersey_number": random.randint(0, 99) if random.random() > 0.4 else None,
            "height": random.choice(HEIGHTS) if random.random() > 0.4 else None,
            "weight": random.randint(100, 220) if random.random() > 0.4 else None,
            "parent_name": f"{random.choice(FIRST_NAMES)} {last}",
            "parent_email": f"parent.{last.lower()}{random.randint(1, 999)}@example.com",
            "parent_phone": f"404-{random.randint(200, 999)}-{random.randint(1000, 9999)}" if random.random() > 0.4 else None,
            "player_email": f"{first.lower()}.{last.lower()}{random.randint(1, 99)}@example.com" if random.random() > 0.5 else None,
            "package_selected": package
        }
        
        if overrides:
            player.update(overrides)
        
        return player

    def create_single_player(self, player_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a single player via API"""
        try:
            response = requests.post(
                f"{self.base_url}/players",
                json=player_data,
                headers={"Content-Type": "application/json"},
                timeout=15
            )
            
            if response.status_code == 201:
                data = response.json()
                if data.get("success"):
                    return {
                        "success": True,
                        "player": data.get("player"),
                        "player_key": data.get("player_key"),
                        "response_time_ms": data.get("response_time_ms", 0)
                    }
            
            return {
                "success": False,
                "error": f"HTTP {response.status_code}: {response.text[:200]}",
                "data": player_data
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "data": player_data
            }

    def create_players(self, count: int, package: str = "free", delay: float = 0.1) -> List[Dict]:
        """Create multiple players sequentially"""
        print(f"\n🏀 Creating {count} players (package: {package})...")
        print(f"   API: {self.base_url}/players\n")
        
        self.stats["start_time"] = time.time()
        self.stats["total"] = count
        
        for i in range(count):
            player_data = self.generate_player_data(package)
            result = self.create_single_player(player_data)
            
            if result["success"]:
                self.stats["success"] += 1
                self.created_players.append(result["player"])
                print(f"  ✓ [{i+1}/{count}] Created: {result['player_key']} - {player_data['player_name']}")
            else:
                self.stats["failed"] += 1
                self.failed_requests.append(result)
                print(f"  ✗ [{i+1}/{count}] Failed: {result.get('error', 'Unknown error')[:50]}")
            
            # Progress bar
            if (i + 1) % 10 == 0 or i == count - 1:
                progress = (i + 1) / count * 100
                print(f"     Progress: {progress:.0f}% ({i+1}/{count})")
            
            time.sleep(delay)  # Rate limiting
        
        self.stats["end_time"] = time.time()
        return self.created_players

    def import_from_csv(self, csv_path: str, package: str = "free") -> List[Dict]:
        """Import players from CSV file"""
        print(f"\n📄 Importing players from {csv_path}...")
        
        players = []
        with open(csv_path, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Map CSV columns to API fields
                player = {
                    "player_name": row.get("player_name", ""),
                    "grad_class": row.get("grad_class", ""),
                    "gender": row.get("gender", ""),
                    "school": row.get("school", ""),
                    "city": row.get("city", ""),
                    "state": row.get("state", ""),
                    "primary_position": row.get("primary_position", ""),
                    "dob": row.get("dob", "2008-01-01"),
                    "parent_name": row.get("parent_name", ""),
                    "parent_email": row.get("parent_email", ""),
                    "package_selected": package
                }
                
                # Add optional fields if present
                for field in ["instagram_handle", "secondary_position", "jersey_number", 
                             "height", "weight", "parent_phone", "player_email", "preferred_name"]:
                    if row.get(field):
                        player[field] = row[field]
                
                players.append(player)
        
        print(f"   Loaded {len(players)} players from CSV\n")
        
        # Create each player
        self.stats["start_time"] = time.time()
        self.stats["total"] = len(players)
        
        for i, player_data in enumerate(players):
            result = self.create_single_player(player_data)
            
            if result["success"]:
                self.stats["success"] += 1
                self.created_players.append(result["player"])
                print(f"  ✓ [{i+1}/{len(players)}] Created: {result['player_key']}")
            else:
                self.stats["failed"] += 1
                self.failed_requests.append(result)
                print(f"  ✗ [{i+1}/{len(players)}] Failed: {result.get('error', 'Unknown error')[:50]}")
            
            time.sleep(0.1)
        
        self.stats["end_time"] = time.time()
        return self.created_players

    def print_summary(self):
        """Print creation summary"""
        duration = (self.stats["end_time"] - self.stats["start_time"]) if self.stats["end_time"] else 0
        avg_time = duration / self.stats["total"] if self.stats["total"] > 0 else 0
        
        print(f"\n{'='*60}")
        print("  BULK CREATION SUMMARY")
        print(f"{'='*60}")
        print(f"  Total Attempted:    {self.stats['total']}")
        print(f"  Successfully Created: {self.stats['success']}")
        print(f"  Failed:             {self.stats['failed']}")
        print(f"  Success Rate:       {self.stats['success']/self.stats['total']*100:.1f}%" if self.stats["total"] > 0 else "  N/A")
        print(f"  Total Time:         {duration:.1f}s")
        print(f"  Avg Time/Player:    {avg_time*1000:.0f}ms")
        print(f"{'='*60}\n")

    def save_results(self, filename: str):
        """Save created players to JSON file"""
        output = {
            "metadata": {
                "created_at": datetime.now().isoformat(),
                "api_host": self.host,
                "count": len(self.created_players),
                "stats": self.stats
            },
            "players": self.created_players,
            "failed": self.failed_requests
        }
        
        with open(filename, 'w') as f:
            json.dump(output, f, indent=2)
        
        print(f"💾 Results saved to: {filename}")


def main():
    parser = argparse.ArgumentParser(
        description="Elite GBB Bulk Player Creator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Create 50 random players
    python3 bulk_player_creator.py --count 50
    
    # Create 100 standard package players
    python3 bulk_player_creator.py --count 100 --package standard
    
    # Import from CSV
    python3 bulk_player_creator.py --csv ../data/sample_players.csv
    
    # Create players with custom output file
    python3 bulk_player_creator.py --count 25 --output my_test_players.json
        """
    )
    
    parser.add_argument("--count", type=int, default=10, help="Number of players to create (default: 10)")
    parser.add_argument("--package", default="free", choices=["free", "standard", "premium"],
                       help="Package type for created players (default: free)")
    parser.add_argument("--csv", help="Import players from CSV file instead of generating")
    parser.add_argument("--output", default="tests/reports/created_players.json",
                       help="Output file for created players JSON (default: tests/reports/created_players.json)")
    parser.add_argument("--host", default=DEFAULT_HOST, help=f"API host URL (default: {DEFAULT_HOST})")
    parser.add_argument("--delay", type=float, default=0.1, help="Delay between requests in seconds (default: 0.1)")
    parser.add_argument("--verbose", action="store_true", help="Enable verbose output")
    
    args = parser.parse_args()
    
    creator = BulkPlayerCreator(host=args.host, verbose=args.verbose)
    
    if args.csv:
        creator.import_from_csv(args.csv, package=args.package)
    else:
        creator.create_players(args.count, package=args.package, delay=args.delay)
    
    creator.print_summary()
    creator.save_results(args.output)


if __name__ == "__main__":
    main()
