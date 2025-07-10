import re
from os import path
from typing import List, Dict, Any
from csv_reader import CSVReader
from unidecode import unidecode

class Parser:
    def __init__(self, file_path):
        self.file_path = file_path
        self.header_pattern = r"^(.*?) (lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche) (\d+) ([A-Za-zé]+) (\d{4}) (\d{2}:\d{2})"
        self.profanity_list = self.load_profanity_list()

    def load_profanity_list(self) -> List[str]:
        """Load the profanity list from a CSV file"""
        csv_path: str = path.join(path.dirname(__file__), 'static', 'data', 'profanity.csv')
        csv_reader = CSVReader(csv_path, delimiter=',', has_header=False)
        return csv_reader.read_all()[0] if csv_reader.read_all() else []
    
    def parse(self) -> List[Dict[str, Any]]:
        """Parse the chat file into a structured format with messages and metadata"""
        with open(self.file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        messages = []
        current_content = []
        current_sender = None
        current_timestamp = None
        
        for line in content.splitlines():
            match = re.match(self.header_pattern, line)
            
            if match:
                # If we already have a message being built, save it first
                if current_sender and current_content:
                    messages.append({
                        'sender': current_sender,
                        'timestamp': current_timestamp,
                        'content': '\n'.join(current_content).strip()
                    })
                    current_content = []
                
                # Extract message metadata
                current_sender = match.group(1).strip()
                day_name = match.group(2)
                day = match.group(3)
                month = match.group(4)
                year = match.group(5)
                time = match.group(6)
                current_timestamp = f"{day_name} {day} {month} {year} {time}"
            
            elif current_sender is not None:
                # Add the line to the current message content
                current_content.append(line)
        
        # Add the last message if there is one
        if current_sender and current_content:
            messages.append({
                'sender': current_sender,
                'timestamp': current_timestamp,
                'content': '\n'.join(current_content).strip()
            })
            
        return messages
    
    def get_lines(self):
        with open(self.file_path, 'r', encoding='utf-8') as file:
            return file.read().splitlines()
    
    def get_message_count(self):
        return len(self.parse())
    
    def get_messages_by_sender(self, sender):
        messages = self.parse()
        return [msg for msg in messages if msg['sender'] == sender]
    
    def get_messages_per_sender(self, unique_senders) -> Dict[str, int]:
        messages_per_sender = {}
        for sender in unique_senders:
            messages_per_sender[sender] = len(self.get_messages_by_sender(sender))
        return messages_per_sender
    
    def get_unique_senders(self):
        messages = self.parse()
        return list(set(msg['sender'] for msg in messages))
    
    def get_word_count(self):
        lines = self.get_lines()
        return sum(len(line.split()) for line in lines)

    def get_character_count(self):
        lines = self.get_lines()
        return sum(len(line) for line in lines)
    
    def get_character_count_per_sender(self):
        """Get character count for each sender"""
        messages = self.parse()
        character_count = {}
        for sender in self.get_unique_senders():
            sender_messages = self.get_messages_by_sender(sender)
            character_count[sender] = sum(len(msg['content']) for msg in sender_messages)
        return character_count

    def get_word_count_per_sender(self):
        """Get word count for each sender"""
        messages = self.parse()
        word_count = {}
        for sender in self.get_unique_senders():
            sender_messages = self.get_messages_by_sender(sender)
            word_count[sender] = sum(len(msg['content'].split()) for msg in sender_messages)
        return word_count
    
    def get_profanity_count_per_sender(self):
        """Count profanity usage by each sender"""
        profanity_count = {}
        
        for sender in self.get_unique_senders():
            sender_messages = self.get_messages_by_sender(sender)
            count = 0
            for msg in sender_messages:
                content = msg['content'].lower()
                normalized_content = unidecode(content)
                for word in self.profanity_list:
                    normalized_word = unidecode(word.lower())
                    count += normalized_content.count(normalized_word)
            profanity_count[sender] = count
        
        return profanity_count

    def get_summary(self):
        """Get a summary of the chat file including total messages, unique senders, and word count"""
        messages = self.parse()
        unique_senders = self.get_unique_senders()
        total_messages = len(messages)
        total_words = self.get_word_count()
        total_characters = self.get_character_count()
        messages_per_sender = self.get_messages_per_sender(unique_senders)
        character_count_per_sender = self.get_character_count_per_sender()
        word_count_per_sender = self.get_word_count_per_sender()
        
        profanity_count_per_sender = self.get_profanity_count_per_sender()
        total_profanity = sum(profanity_count_per_sender.values())
        
        return {
            'total_messages': total_messages,
            'unique_senders': len(unique_senders),
            'total_words': total_words,
            'total_characters': total_characters,
            'total_profanity': total_profanity,
            'unique_senders_list': unique_senders,
            'messages_per_sender': messages_per_sender,
            'character_count_per_sender': character_count_per_sender,
            'word_count_per_sender': word_count_per_sender,
            'profanity_count_per_sender': profanity_count_per_sender,
            'profanity_list': self.profanity_list
        }
    

    #+++++++++++++++  METHODS FOR SPECIFIC LINE EXTRACTION +++++++++++++++#
    
    def get_first_n_lines(self, n):
        lines = self.get_lines()
        return lines[:n] if n < len(lines) else lines

    def get_last_n_lines(self, n):
        lines = self.get_lines()
        return lines[-n:] if n < len(lines) else lines

    def get_lines_with_keyword(self, keyword):
        lines = self.get_lines()
        return [line for line in lines if keyword in line]

    def get_lines_starting_with(self, prefix):
        lines = self.get_lines()
        return [line for line in lines if line.startswith(prefix)]

    def get_lines_ending_with(self, suffix):
        lines = self.get_lines()
        return [line for line in lines if line.endswith(suffix)]

    def get_lines_containing(self, substring):
        lines = self.get_lines()
        return [line for line in lines if substring in line]

    def get_lines_matching_regex(self, regex_pattern):
        import re
        lines = self.get_lines()
        return [line for line in lines if re.search(regex_pattern, line)]

    def get_lines_by_length(self, min_length=0, max_length=float('inf')):
        lines = self.get_lines()
        return [line for line in lines if min_length <= len(line) <= max_length]

    def get_unique_lines(self):
        lines = self.get_lines()
        return list(set(lines))

    def get_sorted_lines(self, reverse=False):
        lines = self.get_lines()
        return sorted(lines, reverse=reverse)