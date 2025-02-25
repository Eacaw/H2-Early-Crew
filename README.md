# Eager Beaver - Meeting Scheduler

Eager Beaver is a web application built with Next.js and Firebase, designed to simplify the process of scheduling meetings with a voting system.

## Features

- **User Authentication:** Secure sign-in with Google using Firebase Authentication.
- **Admin Dashboard:** A protected admin page to manage and schedule meetings.
- **Meeting Scheduling:** Admins can create and schedule meetings with options for repeat frequency and participant selection.
- **Automated Voting:** The application automatically sets up a voting period before each meeting.
- **Firebase Integration:** Utilizes Firebase Firestore for data storage and real-time updates.

## Getting Started

### Prerequisites

- Node.js and npm installed
- Firebase project set up with Authentication and Firestore enabled

### Installation

1.  Clone the repository:

    ```bash
    git clone https://github.com/your-username/eager-beaver.git
    ```

2.  Navigate to the project directory:

    ```bash
    cd eager-beaver
    ```

3.  Install dependencies:

    ```bash
    npm install
    ```

### Configuration

1.  Set up your Firebase configuration in a `.env.local` file:

    ```
    NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
    NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
    ```

2.  Ensure Firebase Authentication and Firestore are properly configured in your Firebase project.

### Running the Application

1.  Start the development server:

    ```bash
    npm run dev
    ```

2.  Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
