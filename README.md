# LifeHub - Personal Management Platform

A modern, highly customizable personal management platform built with Next.js 15, Supabase, and TypeScript. LifeHub provides a widget-based dashboard for managing tasks, tracking mood, monitoring finances, and more.

## 🚀 Features

### **Dynamic Widget System**
- **Database-Driven**: All widgets are stored and managed in Supabase
- **Modular Architecture**: Easy to add new widget types
- **Real-time Updates**: Live data fetching and updates
- **Customizable**: Each widget has configurable settings

### **Built-in Widgets**
1. **Task Manager** 
   - Add, complete, and manage tasks
   - Priority levels (low, medium, high, urgent)
   - Status tracking (pending, in progress, completed)
   - Due date support

2. **Mood Tracker**
   - Daily mood logging with emojis and scores (1-10)
   - Trend analysis and averages
   - Optional notes for context
   - Historical view of recent entries

3. **Finance Tracker**
   - Income and expense tracking
   - Category-based organization
   - Budget progress monitoring
   - Real-time balance calculations

### **Technical Stack**
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **State Management**: Zustand
- **UI Components**: Custom components with Lucide icons
- **Authentication**: Supabase Auth (ready for implementation)

## 🏗️ Architecture

### **Database Schema**
The application uses a comprehensive PostgreSQL schema with:
- **User profiles** extending Supabase auth
- **Widget types** defining available widget categories
- **User widgets** for personalized dashboard layouts
- **Domain-specific tables** (tasks, mood_entries, finance_entries, etc.)
- **Row Level Security** for data isolation

### **API Layer**
RESTful API routes for all operations:
- `/api/widgets` - User widget management
- `/api/widget-types` - Available widget types
- `/api/tasks` - Task operations
- `/api/mood` - Mood tracking
- `/api/finance` - Financial data

### **Widget System**
- **Component Registry**: Dynamic widget loading
- **Configuration System**: JSON-based widget settings
- **Data Fetching**: Each widget manages its own API calls
- **Error Handling**: Comprehensive error states and retry mechanisms

## 🛠️ Setup Instructions

### **Prerequisites**
- Node.js 18+ 
- Supabase account
- Git

### **Installation**

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lifehub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the SQL schema from `supabase/schema.sql`
   - Configure Row Level Security policies

4. **Environment Configuration**
   Create `.env.local` with:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
lifehub/
├── src/
│   ├── app/
│   │   ├── api/                 # API routes
│   │   │   ├── tasks/          # Task management API
│   │   │   ├── mood/           # Mood tracking API
│   │   │   ├── finance/        # Finance tracking API
│   │   │   ├── widgets/        # Widget management API
│   │   │   └── widget-types/   # Widget types API
│   │   ├── dashboard/          # Dashboard page
│   │   └── layout.tsx          # Root layout
│   ├── components/
│   │   ├── dashboard/          # Dashboard components
│   │   ├── widgets/            # Widget components
│   │   └── ui/                 # Shared UI components
│   ├── lib/
│   │   ├── supabase.ts         # Supabase client
│   │   └── utils.ts            # Utility functions
│   ├── store/                  # Zustand stores
│   └── types/                  # TypeScript definitions
├── supabase/
│   └── schema.sql              # Database schema
└── public/                     # Static assets
```

## 🔧 Adding New Widgets

1. **Create the widget component** in `src/components/widgets/`
2. **Add API routes** if needed in `src/app/api/`
3. **Register the component** in `Dashboard.tsx`
4. **Add widget type** to the database via SQL or admin interface

Example widget component:
```typescript
interface MyWidgetProps {
  widgetId: string
  title: string
  config: Record<string, any>
}

export function MyWidget({ widgetId, title, config }: MyWidgetProps) {
  // Widget implementation
  return (
    <WidgetWrapper title={title}>
      {/* Widget content */}
    </WidgetWrapper>
  )
}
```

## 🔐 Security Features

- **Row Level Security**: Database-level access control
- **API Authentication**: Protected routes with user verification
- **Input Validation**: Comprehensive data validation
- **Error Handling**: Graceful error states and fallbacks

## 🚧 Current Limitations

- Authentication system needs Supabase setup
- Some widget types are placeholders (Weather, Calendar, etc.)
- No drag-and-drop widget positioning yet
- Limited widget customization options

## 🎯 Roadmap

- [ ] Complete authentication integration
- [ ] Drag-and-drop dashboard layout
- [ ] More widget types (Weather, Calendar, Notes, Habits)
- [ ] Widget customization interface
- [ ] Data export/import
- [ ] Mobile responsive improvements
- [ ] Performance optimizations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Built with ❤️ using Next.js, Supabase, and modern web technologies.
