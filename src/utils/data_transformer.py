import pandas as pd
import json
import re

from src.database.table_schema import Incorporaciones, Project, Employee, EmployeeDetails, Location, Organization



class data_transformer():

    @staticmethod
    def transform_assi_source_data(data: list(dict), area_column : str, status_column : str, area_filter : str, status_filter : str, assi_columns: list(str)) -> list(Incorporaciones): 
        df = pd.DataFrame(data)

        #Filter candidates by Santander 
        df[df[area_column].str.contains(area_filter, na=False)]
        #Filter candidates that are Onboarding
        df[df[status_column]].str.contains(status_filter, na=False)

        #Reduce the dataframe by column that we will need
        df = df.loc[:,assi_columns]
        
        entries = []
        for index, row in df.iterrows():
            entries.append(Incorporaciones(
                name = row['Name'],
                surname = row['Surname'],
                profile = row['Knowledge (Recruiter)'],
                recruiter = row['Recruiter'],
                organization_id = ,
                location_id = ,
                application_date = row['Application Date'],
                onboarding_date = row['Onboarding Date'],
                cv = row['Cv'],
                email_sent = False,
                incorporated = False
                )
            )
        return entries
    
    @staticmethod
    def filter_by_onboarding_date(data: list(dict), onboarding_column: str, onboarding_date: str) -> pd.DataFrame:
        df = pd.DataFrame(data)
        #Filter candidates by Santander 
        df = df[df[onboarding_column] > onboarding_date]

        return df

    @staticmethod
    def transfrom_employee_source_data(data: list(dict)) -> pd.DataFrame:

        pass
    


        