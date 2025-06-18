# Student Progress Management System

A comprehensive MERN stack application for tracking and managing student progress on Codeforces competitive programming platform.

## Features

### 🎯 Core Features
- **Student Management**: Add, edit, delete students with complete profile information
- **Contest History Tracking**: Monitor contest participation and rating changes
- **Problem Solving Analytics**: Detailed statistics and visualizations
- **Automated Data Sync**: Daily Codeforces data synchronization
- **Inactivity Detection**: Automatic email reminders for inactive students
- **CSV Export**: Download student data for external analysis

### 📊 Analytics & Visualizations
- Rating progress charts
- Problem difficulty distribution
- Submission heatmaps
- Contest performance metrics
- Activity tracking

### 🎨 UI/UX Features
- Fully responsive design (mobile, tablet, desktop)
- Dark/Light mode toggle
- Modern, clean interface using shadcn/ui
- Interactive charts and graphs

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Recharts** - Data visualization
- **Lucide React** - Icons

### Backend
- **Next.js API Routes** - Server-side logic
- **MongoDB** - Database
- **Node.js** - Runtime environment

### External APIs
- **Codeforces API** - Contest and submission data
- **Email Service** - Reminder notifications

## Quick Start

### 1. Environment Setup
Copy `.env.example` to `.env.local` and fill in your values:

\`\`\`bash
cp .env.example .env.local
\`\`\`

### 2. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Database Setup
\`\`\`bash
# For development
npm run setup-db

# For production
npm run setup-prod
\`\`\`

### 4. Email Configuration
For Gmail:
1. Enable 2-factor authentication
2. Generate an app password
3. Use the app password in `EMAIL_PASS`

### 5. Run the Application
\`\`\`bash
npm run dev
\`\`\`

## Environment Variables
Create a `.env.local` file in the root directory:

\`\`\`env
MONGODB_URI=mongodb://localhost:27017/student_progress
NEXTAUTH_SECRET=your-secret-key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
CRON_SECRET=your-cron-secret
\`\`\`

## API Endpoints

### Students
- `GET /api/students` - Get all students
- `POST /api/students` - Create new student
- `PUT /api/students/[id]` - Update student
- `DELETE /api/students/[id]` - Delete student

### Codeforces Integration
- `POST /api/codeforces/sync` - Manual data sync
- `POST /api/cron/sync` - Automated daily sync (cron job)

## Database Schema

### Students Collection
\`\`\`javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  phone: String,
  codeforcesHandle: String (unique),
  currentRating: Number,
  maxRating: Number,
  lastUpdated: Date,
  isActive: Boolean,
  reminderCount: Number,
  emailEnabled: Boolean,
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

### Contests Collection
\`\`\`javascript
{
  _id: ObjectId,
  studentId: ObjectId,
  contestId: Number,
  contestName: String,
  participationDate: Date,
  rank: Number,
  ratingChange: Number,
  newRating: Number,
  problemsSolved: Number,
  totalProblems: Number
}
\`\`\`

### Submissions Collection
\`\`\`javascript
{
  _id: ObjectId,
  studentId: ObjectId,
  submissionId: Number,
  contestId: Number,
  problemName: String,
  problemRating: Number,
  verdict: String,
  submissionTime: Date,
  programmingLanguage: String
}
\`\`\`

## Cron Job Setup

### Vercel (Automatic)
The `vercel.json` file configures automatic daily sync at 2 AM UTC.

### Manual Setup
\`\`\`bash
# Add to your crontab (runs daily at 2 AM)
0 2 * * * curl -X POST https://your-domain.com/api/cron/sync \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
\`\`\`

## Email Configuration

The system uses Nodemailer for sending reminder emails. Configure your email provider in the environment variables.

### Gmail Setup
1. Enable 2-factor authentication
2. Generate an app password
3. Use the app password in `EMAIL_PASS`

## API Testing

### Test Email Service
\`\`\`bash
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type": "application/json" \
  -d '{"email":"test@example.com","type":"welcome"}'
\`\`\`

### Manual Data Sync
\`\`\`bash
curl -X POST http://localhost:3000/api/codeforces/sync \
  -H "Content-Type": "application/json" \
  -d '{"studentId":"STUDENT_ID_HERE"}'
\`\`\`

## Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables
4. Deploy

### Manual Deployment
\`\`\`bash
npm run build
npm start
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


## Support

For support, email omeshmehta70@gmail.com or create an issue on GitHub.

## Roadmap

- [ ] Advanced analytics dashboard
- [ ] Team/batch management
- [ ] Performance comparison tools
- [ ] Mobile app
- [ ] Integration with other competitive programming platforms
- [ ] Advanced notification system
- [ ] Bulk operations for student management

## Acknowledgments

- [Codeforces](https://codeforces.com/) for providing the competitive programming platform and API
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Recharts](https://recharts.org/) for the charting library
- [Next.js](https://nextjs.org/) team for the amazing React framework
- [Vercel](https://vercel.com/) for hosting and deployment platform

---

**Built with ❤️ for the competitive programming community**
