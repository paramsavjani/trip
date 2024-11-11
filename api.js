const { Client } = require("pg");
const readline = require("readline");

const client = new Client({
  host: "dpg-csbsmolds78s73bf2930-a.oregon-postgres.render.com",
  port: 5432,
  user: "param",
  password: "Zqy7G7GjZA04bMD7YPv1ARpKV14naBOU",
  database: "trip_managment",
  ssl: {
    rejectUnauthorized: false,
  },
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  try {
    await client.connect();
    console.log("Connected to the database.");

    while (true) {
      console.log("\nMenu:");
      console.log("1. Retrieve all trips for a given user");
      console.log("2. Find all destinations for a specific trip");
      console.log("3. Get all reviews for a particular trip");
      console.log(
        "4. Calculate total revenue from bookings for a specific trip"
      );
      console.log("5. Find all trips within a specific date range");
      console.log("6. Find all trips longer than 7 days");
      console.log("7. Count total number of trips");
      console.log("8. List all team leaders and trips");
      console.log("9. Find the most expensive trip");
      console.log("10. List all team members for a specific trip");
      console.log("11. Calculate total payments for a specific trip");
      console.log("12. Retrieve trips that have more than 2 members");
      console.log("13. Find trips that have been rated 'excellent'");
      console.log("14. List all reviews with an average rating greater than 4");
      console.log("15. Find the payment methods used for a specific trip");
      console.log("16. Retrieve all activities planned at each trip stop");
      console.log(
        "17. List all users who have participated in more than 3 trips"
      );
      console.log(
        "18. Find the top 3 most expensive trips with more than 3 stops"
      );
      console.log("19. Retrieve full names of users and their trip details");
      console.log("20. Retrieve accommodation details for a specific trip");
      console.log("21. Calculate average rating for a specific trip");
      console.log("0. Exit");

      const c = await askQuestion("Select an option: ");

      switch (c) {
        case "1":
          await getTripsForUser();
          break;
        case "2":
          await getDestinationsForTrip();
          break;
        case "3":
          await getReviewsForTrip();
          break;
        case "4":
          await calculateTotalRevenueForTrip();
          break;
        case "5":
          await findTripsWithinDateRange();
          break;
        case "6":
          await findLongTrips();
          break;
        case "7":
          await countTotalTrips();
          break;
        case "8":
          await listTeamLeadersAndTrips();
          break;
        case "9":
          await findMostExpensiveTrip();
          break;
        case "10":
          await listTeamMembersForTrip();
          break;
        case "11":
          await calculateTotalPaymentsForTrip();
          break;
        case "12":
          await retrieveTripsWithMoreThanTwoMembers();
          break;
        case "13":
          await findTripsRatedExcellent();
          break;
        case "14":
          await listReviewsWithAvgRatingAboveFour();
          break;
        case "15":
          await findPaymentMethodsForTrip();
          break;
        case "16":
          await retrieveActivitiesForTripStop();
          break;
        case "17":
          await listUsersWithMoreThanThreeTrips();
          break;
        case "18":
          await findTopThreeExpensiveTripsWithMoreThanThreeStops();
          break;
        case "19":
          await retrieveFullNamesAndTripDetails();
          break;
        case "20":
          await retrieveAccommodationDetailsForTrip();
          break;
        case "21":
          await calculateAverageRatingForTrip();
          break;
        case "0":
          console.log("Exiting...");
          await client.end();
          rl.close();
          return;
        default:
          console.log("Invalid option. Please try again.");
      }
    }
  } catch (error) {
    console.error("Error connecting to the database:", error);
  }
}

async function askQuestion(query) {
  const ans = await new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
  return ans;
}

async function getTripsForUser() {
  const userAadhaarNo = await askQuestion("Enter User Aadhaar Number: ");
  const result = await client.query(
    `SELECT distinct mt.START_TIME_OF_TRIP, trip.*
       FROM TEAM_MEMBER AS m
       JOIN TEAM_MANAGEMENT AS mt ON m.LEADER_ID = mt.LEADER_ID
       AND m.START_TIME_OF_TRIP = mt.START_TIME_OF_TRIP
	     join trip on trip.trip_id = mt.trip_id
       WHERE m.member_id = $1 or mt.leader_id = $1`,
    [userAadhaarNo]
  );
  console.log("Trips for User:", result.rows);
}

async function getDestinationsForTrip() {
  const tripId = await askQuestion("Enter Trip ID: ");
  const result = await client.query(
    `SELECT RS.city, RS.statename, C.district_name
    FROM ROUTESTOP RS
    JOIN CITY C ON RS.city = C.cityname AND RS.statename = C.statename
    WHERE RS.trip_id = $1`,
    [tripId]
  );
  console.log("Destinations for Trip:", result.rows);
}

async function getReviewsForTrip() {
  const tripId = await askQuestion("Enter Trip ID: ");
  const result = await client.query(
    `SELECT R.user_id, R.rating, R.comment, R.review_date
    FROM REVIEW R
    JOIN TEAM_MANAGEMENT TM ON R.LEADER_ID = TM.LEADER_ID 
    AND R.START_TIME_OF_TRIP = TM.START_TIME_OF_TRIP
    WHERE TM.TRIP_ID = $1`,
    [tripId]
  );
  console.log("Reviews for Trip:", result.rows);
}

async function calculateTotalRevenueForTrip() {
  const tripId = await askQuestion("Enter Trip ID: ");
  const result = await client.query(
    `select
    sum(memcount) * (
        select
            price
        from
            trip
        where
            trip_id = $1
    ) as total
from
    (
        select count(member_id) as memcount
        from
            team_member
        where
            concat (LEADER_ID, START_TIME_OF_TRIP) in (
                select
                    concat (LEADER_ID, START_TIME_OF_TRIP) 
					from 
					TEAM_MANAGEMENT
                where
                    trip_id = $1
            )
    ) as f;`,
    [tripId]
  );
  console.log("Total Revenue for Trip:", result.rows);
}

async function findTripsWithinDateRange() {
  const startDate = await askQuestion("Enter Start Date (YYYY-MM-DD): ");
  const endDate = await askQuestion("Enter End Date (YYYY-MM-DD): ");
  const result = await client.query(
    `SELECT T.trip_id, T.description, T.duration, T.price, T.total_stop
     FROM TEAM_MANAGEMENT TM
     JOIN TRIP T ON TM.TRIP_ID = T.trip_id
     WHERE TM.START_TIME_OF_TRIP BETWEEN $1 AND $2`,
    [startDate, endDate]
  );
  console.log("Trips within Date Range:", result.rows);
}

async function findLongTrips() {
  const result = await client.query(
    `SELECT trip_id, description, duration
     FROM TRIP
     WHERE duration > 7`
  );
  console.log("Trips longer than 7 days:", result.rows);
  for (let index = 0; index < result.rowCount; index++) {
    const element = result.rows[index];
    console.log(element);
  }
}

async function countTotalTrips() {
  const result = await client.query(
    `SELECT COUNT(*) AS total_trips
     FROM TRIP`
  );
  console.log("Total Trips:", result.rows[0].total_trips);
}

//*** */
async function listTeamLeadersAndTrips() {
  const result = await client.query(
    // `SELECT LEADER_ID, TRIP_ID
    //  FROM TEAM_MANAGEMENT`
    `SELECT tu.first_name, tu.middle_name, tu.last_name, t.description
    FROM tripuser tu
JOIN team_management tm ON tu.aadhaar_no = tm.leader_id
JOIN trip t ON tm.trip_id = t.trip_id;
`
  );
  console.log("Team Leaders and Trips:", result.rows);
}

//*** */
async function findMostExpensiveTrip() {
  const result = await client.query(
    `SELECT trip_id, description, price
     FROM TRIP
     ORDER BY price DESC
     LIMIT 1`
  );
  console.log("Most Expensive Trip:", result.rows[0]);
}

//*** */
async function listTeamMembersForTrip() {
  const leaderId = await askQuestion("Enter Leader ID: ");
  const startTimeOfTrip = await askQuestion(
    "Enter Start Time of Trip (YYYY-MM-DD HH:MM:SS): "
  );
  const result = await client.query(
    `SELECT member_id
    FROM TEAM_MEMBER
    WHERE LEADER_ID = $1 AND START_TIME_OF_TRIP = $2`,
    [leaderId, startTimeOfTrip]
  );
  console.log("Team Members for Trip:", result.rows);
}

//*** */
async function calculateTotalPaymentsForTrip() {
  const leaderId = await askQuestion("Enter Leader ID: ");
  const startTimeOfTrip = await askQuestion(
    "Enter Start Time of Trip (YYYY-MM-DD HH:MM:SS): "
  );
  const result = await client.query(
    `SELECT SUM(amount_paid) AS total_amount
     FROM PAYMENT
     WHERE LEADER_ID = $1 AND START_TIME_OF_TRIP = $2`,
    [leaderId, startTimeOfTrip]
  );
  t = result.rows[0].total_amount;
  if (t == null) t = 0;
  console.log("Total Payments for Trip:", t);
}

async function retrieveTripsWithMoreThanTwoMembers() {
  const result = await client.query(
    `SELECT T.LEADER_ID, T.START_TIME_OF_TRIP, COUNT(TM.member_id) AS total_members
     FROM TEAM_MANAGEMENT T
     JOIN TEAM_MEMBER TM ON T.LEADER_ID = TM.LEADER_ID AND T.START_TIME_OF_TRIP = TM.START_TIME_OF_TRIP
     GROUP BY T.LEADER_ID, T.START_TIME_OF_TRIP
     HAVING COUNT(TM.member_id) > 2`
  );
  console.log("Trips with More Than 2 Members:", result.rows);
}

async function findTripsRatedExcellent() {
  const result = await client.query(
    `SELECT LEADER_ID, START_TIME_OF_TRIP, comment
     FROM REVIEW
     WHERE comment LIKE 'excellent trip'`
  );
  console.log("Trips Rated 'Excellent':", result.rows);
}

async function listReviewsWithAvgRatingAboveFour() {
  const result = await client.query(
    `SELECT LEADER_ID, START_TIME_OF_TRIP, AVG(rating) AS avg_rating
     FROM REVIEW
     GROUP BY LEADER_ID, START_TIME_OF_TRIP
     HAVING AVG(rating) > 4`
  );
  console.log("Reviews with Average Rating > 4:", result.rows);
}

async function findPaymentMethodsForTrip() {
  const leaderId = await askQuestion("Enter Leader ID: ");
  const startTimeOfTrip = await askQuestion(
    "Enter Start Time of Trip (YYYY-MM-DD HH:MM:SS): "
  );
  const result = await client.query(
    `SELECT payment_method, payment_date, amount_paid
     FROM PAYMENT
     WHERE LEADER_ID = $1 AND START_TIME_OF_TRIP = $2`,
    [leaderId, startTimeOfTrip]
  );
  console.log("Payment Methods for Trip:", result.rows);
}

async function retrieveActivitiesForTripStop() {
  const tripId = await askQuestion("Enter Trip ID: ");
  const result = await client.query(
    `SELECT stop_number, name, description
     FROM ACTIVITY
     WHERE TRIP_ID = $1`,
    [tripId]
  );
  console.log("Activities for Each Trip Stop:", result.rows);
}

async function listUsersWithMoreThanThreeTrips() {
  const result = await client.query(
    `SELECT member_id, COUNT(START_TIME_OF_TRIP) AS trip_count
     FROM TEAM_MEMBER
     GROUP BY member_id
     HAVING COUNT(START_TIME_OF_TRIP) > 3`
  );
  console.log("Users with More Than 3 Trips:", result.rows);
}

async function findTopThreeExpensiveTripsWithMoreThanThreeStops() {
  const result = await client.query(
    `SELECT T.trip_id, T.description, T.price
     FROM TRIP T
     JOIN ROUTESTOP R ON T.trip_id = R.trip_id
     GROUP BY T.trip_id, T.description, T.price
     HAVING COUNT(R.stop_number) > 3
     ORDER BY T.price DESC
     LIMIT 3`
  );
  console.log("Top 3 Most Expensive Trips with > 3 Stops:", result.rows);
}

async function retrieveFullNamesAndTripDetails() {
  const result = await client.query(
    `SELECT TU.aadhaar_no, CONCAT(TU.first_name, ' ', TU.middle_name, ' ', TU.last_name) AS full_name,
            TU.phone_no, TU.email, TM.LEADER_ID, TM.START_TIME_OF_TRIP, T.trip_id, T.description,
            T.duration, T.price
     FROM tripUser TU
     JOIN TEAM_MEMBER TM ON TU.aadhaar_no = TM.member_id
     JOIN TEAM_MANAGEMENT TMG ON TM.LEADER_ID = TMG.LEADER_ID AND TM.START_TIME_OF_TRIP = TMG.START_TIME_OF_TRIP
     JOIN TRIP T ON TMG.TRIP_ID = T.trip_id`
  );
  console.log("User Full Names and Trip Details:", result.rows);
}

async function retrieveAccommodationDetailsForTrip() {
  const tripId = await askQuestion("Enter Trip ID: ");
  const result = await client.query(
    `SELECT A.stop_number, A.address, A.number_of_days_between_start_and_checkin,
            A.duration_of_stay, A.checkin_time, A.checkout_time, A.contact_info
     FROM ACCOMMODATION A
     WHERE A.trip_id = $1`,
    [tripId]
  );
  console.log("Accommodation Details for Trip:", result.rows);
}

async function calculateAverageRatingForTrip() {
  const tripId = await askQuestion("Enter Trip ID: ");
  const result = await client.query(
    `SELECT AVG(R.rating) AS avg_rating
     FROM REVIEW R
     JOIN TEAM_MANAGEMENT TM ON R.LEADER_ID = TM.LEADER_ID AND R.START_TIME_OF_TRIP = TM.START_TIME_OF_TRIP
     WHERE TM.TRIP_ID = $1`,
    [tripId]
  );
  console.log("Average Rating for Trip:", result.rows[0].avg_rating);
}

main();
