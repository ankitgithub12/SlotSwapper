# SlotSwapper - Peer-to-Peer Time Slot Scheduling Application

## 📋 Project Overview
SlotSwapper is a full-stack web application that enables users to swap busy time slots with each other. Built as a technical assignment for ServiceHive, this application features real-time notifications, secure authentication, and complex swap logic.

**Live Demo:** 
- Frontend: https://slotswapper-frontend-rtry.onrender.com
- Backend: https://slotswapper-backend-kapb.onrender.com

## 🚀 Features Implemented

### ✅ Core Requirements
- **User Authentication** - JWT-based signup/login
- **Calendar Management** - Create, view, and manage time slots
- **Swap Marketplace** - Browse and request swaps with other users
- **Swap Requests** - Send, accept, or reject swap proposals
- **Real-time Notifications** - Live updates using Socket.io

### ⭐ Bonus Features
- **Real-time WebSocket Notifications**
- **Full Production Deployment** on Render
- **Responsive UI** with modern design
- **State Management** with React Context API

## 🛠 Technology Stack

### Frontend
- **React** with Hooks and Context API
- **Axios** for API calls
- **Socket.io-client** for real-time features
- **React Router** for navigation
- **CSS3** with custom design system

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Socket.io** for WebSocket connections
- **CORS** with secure configuration
- **bcryptjs** for password hashing

### Deployment
- **Frontend:** Render
- **Backend:** Render
- **Database:** MongoDB Atlas

## 📁 Project Structure

```
slotswapper/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # Auth & Socket contexts
│   │   ├── hooks/          # Main pages
│   │   └── App.jsx         # Main app component
│   └── package.json
├── server/                 # Node.js backend
│   ├── routes/             # API routes
│   ├── models/             # MongoDB models
│   ├── middleware/         # Auth middleware
│   └── server.js           # Main server file
└── README.md
```

## 🗄 Database Schema

### User Model
```javascript
{
  name: String,
  email: String,
  password: String,
  isAdmin: Boolean
}
```

### Event/Slot Model
```javascript
{
  title: String,
  startTime: Date,
  endTime: Date,
  status: String, // 'BUSY', 'SWAPPABLE', 'SWAP_PENDING'
  userId: ObjectId
}
```

### SwapRequest Model
```javascript
{
  requesterId: ObjectId,
  recipientId: ObjectId,
  requesterSlotId: ObjectId,
  recipientSlotId: ObjectId,
  status: String, // 'PENDING', 'ACCEPTED', 'REJECTED'
  createdAt: Date
}
```

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/me` | Get current user |

### Events/Slots
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | Get user's events |
| POST | `/api/events` | Create new event |
| PUT | `/api/events/:id` | Update event |
| DELETE | `/api/events/:id` | Delete event |

### Swap System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/swap/swappable-slots` | Get available slots from other users |
| POST | `/api/swap/request` | Create swap request |
| POST | `/api/swap/response/:requestId` | Accept/reject swap request |
| GET | `/api/swap/incoming` | Get incoming swap requests |
| GET | `/api/swap/outgoing` | Get outgoing swap requests |

### WebSocket Events
- `join-user` - Join user's notification room
- `new-swap-request` - New swap request notification
- `swap-accepted` - Swap accepted notification
- `swap-rejected` - Swap rejected notification

## 🚀 Local Development Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- Git

### Step 1: Clone Repository
```bash
git clone <your-repository-url>
cd slotswapper
```

### Step 2: Backend Setup
```bash
cd server
npm install
```

Create `.env` file in server directory:
```env
MONGODB_URI=mongodb://localhost:27017/slotswapper
JWT_SECRET=your_jwt_secret_here
PORT=5000
CLIENT_URLS=http://localhost:3000
NODE_ENV=development
```

Start backend:
```bash
npm run dev
```

### Step 3: Frontend Setup
```bash
cd ../client
npm install
```

Create `.env` file in client directory:
```env
REACT_APP_API_URL=http://localhost:5000
```

Start frontend:
```bash
npm start
```

### Step 4: Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/health

## 🐳 Docker Setup (Alternative)

```bash
# Using docker-compose
docker-compose up --build

# Or build individually
docker build -t slotswapper-backend ./server
docker build -t slotswapper-frontend ./client
```

## 🧪 Testing the Application

1. **Register** a new account
2. **Create events** with different statuses (BUSY, SWAPPABLE)
3. **Browse marketplace** for available slots
4. **Send swap requests** to other users
5. **Accept/reject** incoming requests
6. **Watch real-time notifications**

## 🔧 Design Decisions & Challenges

### Key Design Decisions
1. **Real-time Notifications**: Implemented Socket.io for instant updates
2. **Context API**: Used for global state management instead of Redux
3. **MongoDB**: Chosen for flexible schema with evolving requirements
4. **JWT Authentication**: Stateless auth suitable for scaling

### Challenges Faced
1. **Swap Transaction Logic**: Ensuring data consistency during slot exchanges
2. **CORS Configuration**: Complex setup for production deployment
3. **WebSocket Reconnection**: Handling socket reconnects and room rejoining
4. **State Synchronization**: Keeping UI in sync with backend changes

### Assumptions Made
1. Time slots are 1-hour duration for simplicity
2. Users can only swap entire slots, not partial periods
3. Once swapped, slots become BUSY and cannot be re-swapped immediately
4. Notifications are ephemeral and not stored long-term

## 🚀 Production Deployment

The application is fully deployed on Render:
- **Frontend**: Automatic deploys from main branch
- **Backend**: Manual deploys with environment variables
- **Database**: MongoDB Atlas cloud database

### Environment Variables for Production
```env
MONGODB_URI=mongodb_atlas_connection_string
JWT_SECRET=secure_random_secret
CLIENT_URLS=https://slotswapper-frontend-rtry.onrender.com
NODE_ENV=production
```

## 📞 Support

For any issues with setup or running the application:
1. Check the browser console for errors
2. Verify all environment variables are set
3. Ensure MongoDB connection is working
4. Check Render deployment logs

## 👨‍💻 Developer

Built with ❤️ for ServiceHive Full Stack Intern position.

**Note**: This is a demonstration project for technical assessment purposes.
