import csv
from typing import List, Dict, Any, Optional, Iterator

class CSVReader:
    """A class for reading and processing CSV files."""
    
    def __init__(self, filepath: str, delimiter: str = ',', has_header: bool = True):
        """
        Initialize the CSVReader with file path and reading options.
        
        Args:
            filepath: Path to the CSV file
            delimiter: Character used to separate fields (default is comma)
            has_header: Whether the CSV file has a header row (default is True)
        """
        self.filepath = filepath
        self.delimiter = delimiter
        self.has_header = has_header
        self.headers = []
        
    def read_all(self) -> List[Dict[str, Any]]:
        """
        Read the entire CSV file and return its contents.
        
        Returns:
            If has_header is True: List of dictionaries mapping column names to values
            If has_header is False: List of rows as lists
        """
        with open(self.filepath, 'r', newline='') as file:
            if self.has_header:
                reader = csv.DictReader(file, delimiter=self.delimiter)
                self.headers = reader.fieldnames
                return list(reader)
            else:
                reader = csv.reader(file, delimiter=self.delimiter)
                return list(reader)
    
    def read_row_by_row(self) -> Iterator[Dict[str, Any]]:
        """
        Generator that yields rows one by one, useful for large files.
        
        Yields:
            If has_header is True: Dictionary mapping column names to values for each row
            If has_header is False: List of values for each row
        """
        with open(self.filepath, 'r', newline='') as file:
            if self.has_header:
                reader = csv.DictReader(file, delimiter=self.delimiter)
                self.headers = reader.fieldnames
                for row in reader:
                    yield row
            else:
                reader = csv.reader(file, delimiter=self.delimiter)
                for row in reader:
                    yield row
    
    def get_column(self, column_name: str) -> List[Any]:
        """
        Extract a specific column from the CSV file.
        
        Args:
            column_name: Name of the column to extract
            
        Returns:
            List of values from the specified column
        
        Raises:
            ValueError: If the file doesn't have headers or the column doesn't exist
        """
        if not self.has_header:
            raise ValueError("Cannot get column by name in a CSV without headers")
            
        column_values = []
        for row in self.read_row_by_row():
            if column_name not in row:
                raise ValueError(f"Column '{column_name}' not found in CSV")
            column_values.append(row[column_name])
        return column_values
    
    def get_headers(self) -> List[str]:
        """
        Get the headers from the CSV file.
        
        Returns:
            List of header names
            
        Raises:
            ValueError: If the file doesn't have headers
        """
        if not self.has_header:
            raise ValueError("CSV file does not have headers")
            
        if not self.headers:
            # Read first row to get headers if they haven't been loaded yet
            with open(self.filepath, 'r', newline='') as file:
                reader = csv.reader(file, delimiter=self.delimiter)
                self.headers = next(reader)
        
        return self.headers