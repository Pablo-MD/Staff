import gspread
import pandas as pd
import json


from src.settings import SERVICE_ACCOUNT_FILE

class GSheetManager():
    """
    Establishes a connection to Google Sheets and retrieves data from a specified
    worksheet
    """

    def __init__(self, spreadsheet: str, workshseet: str): 

        self.spreadsheet_name = spreadsheet
        self.worksheet_name = workshseet

        self.gc = None
        self.spreadsheet = None
        self.worksheet = None

    def initialize_connection(self):
        if self.gc is None:
            try: 
                self.gc = gspread.service_account(SERVICE_ACCOUNT_FILE)
                self.spreadsheet = self.gc.open(self.spreadsheet_name)
                self.worksheet = self.spreadsheet.worksheet(self.worksheet_name)
            except Exception as e: 
                print(f"Error {e}")    

    def get_all_data(self):
        if self.gc is not None: 
            return self.worksheet.get_all_records()
        else: 
            print("A connection is needed to retrieve the data")





