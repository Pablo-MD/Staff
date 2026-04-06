import os
import sys

sys.path.append(os.path.abspath(r"/home/pabs/Documents/Work/Staff/"))

from src.utils.gs_extractor import GSheetManager
from src.utils.data_transformer import data_transformer

if __name__ == "__main__":
    gs = GSheetManager("Copy of Cuadro de Mando GT - Junior", "Candidatos Recruiting Jr")
    gs.initialize_connection()
    
    assi_df = data_transformer.transform_assi_source_data(gs.get_all_data())
    print(assi_df)
    pass
