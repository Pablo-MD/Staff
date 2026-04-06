"""
sudo systemctl start postgresql

# Switch to postgres user to create a test DB and user
sudo -u postgres -i
createdb test_db
createuser --interactive  # Create a user with login and DB creation rights
exit

isntall sqlalchemy & driver
pip install sqlalchemy psycopg2-binary
"""

from sqlalchemy import  Column, Integer, String, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import create_engine
import datetime

DATABASE_URL = "postgresql+psycopg2://pablo_nfq_tester:160577@localhost:5432/test_db"

Base = declarative_base()
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

# 2. Define Table Models
class TestData(Base):
    __tablename__ = 'test_results'
    
    id = Column(Integer, primary_key=True)
    metric_name = Column(String(50))
    value = Column(Integer)
    created_at = Column(DateTime, default=datetime.datetime.now(datetime.timezone.utc))

# 3. Create Tables in PostgreSQL
def init_db():
    Base.metadata.create_all(engine)
    print("Tables created successfully!")

if __name__ == "__main__":
    init_db()

# 1. Ingesting Data (Create)
# To add data, you create an instance of your class and add it to the session.
def ingest():
    Session = sessionmaker(bind=engine)
    session = Session()

    new_entry = TestData(metic_name="CPU_Usage", value=42)
    try:
        session.add(new_entry)
        session.commit()
        print(f"Added etnry with ID: {new_entry.id}")
    except Exception as e:
        session.rollback()
        print(f"Error: {e}")
    finally: 
        session.close()

    entries = [
        TestData(metric_name = "Memory", value = 1024),
        TestData(metric_name = "Disk_IO", value = 150)
    ]

    session.add_all(entries)
    session.comit()

# 2. Accessing Information (Read)
# SQLAlchemy provides a powerful querying interface. In modern SQLAlchemy (2.0 style), we use select.

def read():
    from sqlalchemy import select

    with Session() as session: 
        statement = select(TestData).order_by(TestData.create_at.desc())
        results = session.execute(statement).scalars().all()

        for row in results:
            print(f"{row.create_at} - {row.metric_name}: {row.value}")

        query = select(TestData).where(TestData.metric_name == "CPU_Usage")
        cpu_data - session.execute(query).scalars().first()
        print(f"Found: {cpu_data.value if cpu_data else 'None'}")

# 3. Updating and Deleting
# Updating is as simple as modifying the Python object and committing the session.    

def modify_delete(): 
    item = session.get(TestData, 1)
    if item:
        item.value = 99
        session.commit()

    if item: 
        session.delete(item)
    session.commit()

# 4. Pro-Tip: Using Pandas for Quick Analysis
# Since your end goal is GCS, you might want 
# to view your data in a tabular format immediately. Pandas plays very nicely with SQLAlchemy engines.    

def read_with_pandas():
    import pandas as pd

    df = pd.read_sql_table("test_results", engine)
    print(df.head())

