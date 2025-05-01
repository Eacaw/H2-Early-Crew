# Eager Beaver

Eager Beaver is a web application designed to facilitate and gamify meeting punctuality for teams. It provides a dashboard for tracking attendance, voting for meeting participants, and maintaining a leaderboard of the most punctual members.

## Application Overview

Eager Beaver helps teams run engaging and accountable early meetings by allowing users to:

- View upcoming meetings and vote for participants.
- Track metrics such as total users, total votes, and top winners.
- See a leaderboard and progress of participants over time.

## Application Pages

### Login (`/login`)

- If the user is not authenticated, they are redirected to the login page on first load.
- Allows users to authenticate and access the dashboard.

### Dashboard (`/`)

- **Metrics:** Displays total users, total votes, and the top winner.
- **Upcoming Meeting:** Shows details of the next scheduled meeting.
- **Voting Panel:** Allows users to vote for meeting participants.
- **Leaderboard:** Ranks users based on their wins.
- **Progress:** Shows user progress over time.

### Calendar (`/calendar`)

- Routing is based on week dates, eg. `/calendar/01/01` will bring you to the first week in January.
- Displays a calendar view of all meetings.
- Allows admin users to add new meetings.
- Admin Users can edit or delete meetings they created.

### Profile (`/profile`)

- Displays user profile information.
- Shows user statistics, including total votes and wins.
- Allows users to view their voting history.

## Target Audience

This application is intended for teams or organizations that hold regular meetings and want to encourage participation and punctuality through friendly competition and transparent tracking.

## Local Development Setup

### Prerequisites

- Node.js (v16 or higher recommended)
- npm or yarn
- A Firebase project (see below)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-org/eager-beaver.git
   cd eager-beaver
   ```

2. **Install dependencies:**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure Firebase:**

   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/).
   - Enable Firestore Database and Authentication (Email/Password or your preferred provider).
   - Set your firebase configuration in the `lib/firebase.js` file.

4. **Run the development server:**

   ```bash
   npm run dev
   ```

5. **Open the app:**
   Visit [http://localhost:3000](http://localhost:3000) in your browser.

## Firebase Setup Requirements

- **Firestore Collections:**

  - `users`: Stores user profiles and stats.
  - `meetings`: Stores meeting details, votes, and winners.

- **Authentication:**

  - Enable at google authentication to utilise the already existing login form, or set up your preferred authentication method.

- **Security Rules:**
  - Set up appropriate Firestore security rules to protect user data.

---

For questions or contributions, please open an issue or pull request on GitHub.
