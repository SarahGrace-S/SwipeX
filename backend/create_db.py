import os
import sys
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

db_name = os.getenv('DB_NAME', 'swipex')
db_user = os.getenv('DB_USER', 'postgres')
db_password = os.getenv('DB_PASSWORD', '')
db_host = os.getenv('DB_HOST', 'localhost')
db_port = os.getenv('DB_PORT', '5432')

if db_password == 'YOUR_PASSWORD_HERE' or not db_password:
    print("WARNING: Please set your actual PostgreSQL password in backend/.env first.")
    sys.exit(1)

print(f"Connecting to PostgreSQL server on {db_host}:{db_port} as user '{db_user}'...")
try:
    # Connect to the default 'postgres' database to verify connection and manage DBs
    conn = psycopg2.connect(
        dbname='postgres',
        user=db_user,
        password=db_password,
        host=db_host,
        port=db_port
    )
    conn.autocommit = True
    cursor = conn.cursor()
    
    # Check if database exists
    cursor.execute(f"SELECT 1 FROM pg_database WHERE datname = %s;", (db_name,))
    exists = cursor.fetchone()
    
    if not exists:
        print(f"Database '{db_name}' does not exist. Creating...")
        cursor.execute(f"CREATE DATABASE {db_name};")
        print(f"Database '{db_name}' created successfully!")
    else:
        print(f"Database '{db_name}' already exists.")
        
    cursor.close()
    conn.close()
    print("Connection check and database setup completed successfully.")
except Exception as e:
    print(f"\n[ERROR] Failed to connect to PostgreSQL: {e}")
    print("\nPlease verify that:")
    print("1. Your PostgreSQL service is running.")
    print("2. The database password in backend/.env is correct.")
    sys.exit(1)
