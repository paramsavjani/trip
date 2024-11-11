import psycopg2
from psycopg2 import sql
import sys

# Database connection configuration
connection_params = {
    "host": "dpg-csbsmolds78s73bf2930-a.oregon-postgres.render.com",
    "port": 5432,
    "user": "param",
    "password": "Zqy7G7GjZA04bMD7YPv1ARpKV14naBOU",
    "dbname": "trip_managment",
    "sslmode": "require",
}


# Function to connect to the PostgreSQL database
def connect_db():
    try:
        conn = psycopg2.connect(**connection_params)
        print("Connected to the database.")
        return conn
    except Exception as e:
        print("Error connecting to the database:", e)
        sys.exit(1)


# Function to execute a query and fetch results
def execute_query(conn, query, params=None):
    with conn.cursor() as cur:
        cur.execute(query, params)
        return cur.fetchall()


# Function to ask for user input
def ask_question(prompt):
    return input(prompt)


# Function to get trips for a user
def get_trips_for_user(conn):
    user_aadhaar_no = ask_question("Enter User Aadhaar Number: ")
    query = """
        SELECT DISTINCT mt.START_TIME_OF_TRIP, trip.*
        FROM TEAM_MEMBER AS m
        JOIN TEAM_MANAGEMENT AS mt ON m.LEADER_ID = mt.LEADER_ID
        AND m.START_TIME_OF_TRIP = mt.START_TIME_OF_TRIP
        JOIN trip ON trip.trip_id = mt.trip_id
        WHERE m.member_id = %s OR mt.leader_id = %s
    """
    results = execute_query(conn, query, (user_aadhaar_no, user_aadhaar_no))
    print("Trips for User:", results)


# Function to get destinations for a trip
def get_destinations_for_trip(conn):
    trip_id = ask_question("Enter Trip ID: ")
    query = """
        SELECT RS.city, RS.statename, C.district_name
        FROM ROUTESTOP RS
        JOIN CITY C ON RS.city = C.cityname AND RS.statename = C.statename
        WHERE RS.trip_id = %s
    """
    results = execute_query(conn, query, (trip_id,))
    print("Destinations for Trip:", results)


# Function to calculate total revenue for a trip
def calculate_total_revenue_for_trip(conn):
    trip_id = ask_question("Enter Trip ID: ")
    query = """
        SELECT sum(memcount) * (
            SELECT price FROM trip WHERE trip_id = %s
        ) AS total
        FROM (
            SELECT count(member_id) AS memcount
            FROM team_member
            WHERE concat(LEADER_ID, START_TIME_OF_TRIP) IN (
                SELECT concat(LEADER_ID, START_TIME_OF_TRIP)
                FROM TEAM_MANAGEMENT WHERE trip_id = %s
            )
        ) AS f;
    """
    results = execute_query(conn, query, (trip_id, trip_id))
    print("Total Revenue for Trip:", results[0][0] if results else 0)


# Function to list team leaders and their trips
def list_team_leaders_and_trips(conn):
    query = """
        SELECT tu.first_name, tu.middle_name, tu.last_name, t.description
        FROM tripuser tu
        JOIN team_management tm ON tu.aadhaar_no = tm.leader_id
        JOIN trip t ON tm.trip_id = t.trip_id
    """
    results = execute_query(conn, query)
    print("Team Leaders and Trips:", results)


# Function to list all trips longer than 7 days
def find_long_trips(conn):
    query = """
        SELECT trip_id, description, duration
        FROM trip
        WHERE duration > 7
    """
    results = execute_query(conn, query)
    print("Trips longer than 7 days:", results)


# Main menu function
def main():
    conn = connect_db()

    while True:
        print("\nMenu:")
        print("1. Retrieve all trips for a given user")
        print("2. Find all destinations for a specific trip")
        print("4. Calculate total revenue from bookings for a specific trip")
        print("8. List all team leaders and trips")
        print("6. Find all trips longer than 7 days")
        print("0. Exit")
        choice = ask_question("Select an option: ")

        try:
            if choice == "1":
                get_trips_for_user(conn)
            elif choice == "2":
                get_destinations_for_trip(conn)
            elif choice == "4":
                calculate_total_revenue_for_trip(conn)
            elif choice == "8":
                list_team_leaders_and_trips(conn)
            elif choice == "6":
                find_long_trips(conn)
            elif choice == "0":
                print("Exiting...")
                conn.close()
                break
            else:
                print("Invalid option. Please try again.")
        except Exception as e:
            print("Error executing query:", e)


if __name__ == "__main__":
    main()
