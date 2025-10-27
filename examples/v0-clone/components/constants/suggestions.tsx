import {
  Rocket,
  BarChart3,
  Briefcase,
  ShoppingBag,
  ListChecks,
} from 'lucide-react'

export const suggestions = [
  {
    Copy: 'SaaS Landing Page',
    Icon: <Rocket className="size-4" />,
    Prompt: `
    Create a modern, conversion-focused landing page for a fictional SaaS productivity tool called "StreamFlow". The landing page should include:

**Header Section:**
- Company logo and navigation menu (Features, Pricing, About, Contact)
- "Start Free Trial" CTA button in the header

**Hero Section:**
- Bold headline: "Streamline Your Team's Workflow"
- Supporting subheadline describing the product value
- Email input field with prominent "Get Started Free" CTA button
- Hero image or illustration showing the product dashboard

**Features Section:**
- Grid layout showcasing 4 key features with icons
- Each feature includes a title, brief description, and visual element
- Features: Real-time Collaboration, Smart Automation, Analytics Dashboard, Integrations

**Social Proof Section:**
- Customer testimonials with photos, names, and companies
- Trust badges or logos of well-known companies using the product
- Statistics showing user satisfaction (e.g., "10,000+ teams trust StreamFlow")

**Pricing Section:**
- 3 pricing tiers displayed as cards (Starter, Professional, Enterprise)
- Monthly pricing with key features listed
- Highlighted "most popular" plan
- "Choose Plan" buttons for each tier

**Final CTA Section:**
- Strong call-to-action encouraging sign-ups
- Brief text: "Ready to transform your workflow?"
- Email input with CTA button

**Footer:**
- Links organized by category (Product, Company, Resources, Legal)
- Social media icons
- Copyright information

Use a modern color scheme with gradients, ensure mobile responsiveness, and include smooth scroll animations. Style with Tailwind CSS and use shadcn/ui components.
    `,
  },
  {
    Copy: 'Analytics Dashboard',
    Icon: <BarChart3 className="size-4" />,
    Prompt: `
      Create a comprehensive analytics dashboard for a fictional project management SaaS application. The dashboard should include:

**Top Navigation:**
- App logo and name "TaskFlow Analytics"
- Search bar
- Notifications bell icon
- User profile dropdown

**Sidebar Navigation:**
- Dashboard (active)
- Projects
- Team Members
- Reports
- Settings
- Collapsible menu with icons

**Main Dashboard Content:**
**Stats Overview (Top Row):**
- 4 metric cards displaying: Total Projects, Active Tasks, Team Members, Completion Rate
- Each card shows the metric value, percentage change, and small trend indicator

**Charts Section (Middle Row):**
- Line chart showing "Project Progress Over Time" (last 30 days)
- Donut chart displaying "Tasks by Status" (To Do, In Progress, Done, Blocked)
- Bar chart showing "Team Performance" by member

**Recent Activity Section:**
- Table displaying recent project activities
- Columns: Activity, Project, User, Timestamp
- Last 10 activities with appropriate icons

**Quick Actions Panel (Right Sidebar):**
- "Create New Project" button
- "Invite Team Member" button
- "Generate Report" button
- Upcoming deadlines list

Use a clean, professional design with a light/dark mode toggle. Implement with React, Tailwind CSS, and use Recharts for data visualization. Include responsive design for mobile and tablet views. Use realistic mock data.
    `,
  },
  {
    Copy: 'Portfolio Website',
    Icon: <Briefcase className="size-4" />,
    Prompt: `
      Create a modern, minimalist portfolio website for a fictional UX/UI designer named "Alex Rivera". The portfolio should include:

**Header (Fixed/Sticky):**
- Designer name/logo on the left
- Navigation menu: Work, About, Contact
- Theme toggle (light/dark mode)

**Hero Section:**
- Large, eye-catching introduction: "UX/UI Designer crafting delightful digital experiences"
- Animated subtitle showing rotating text: "Product Designer • Visual Artist • Problem Solver"
- Scroll indicator arrow

**Featured Work Section:**
- Grid layout (2 columns on desktop, 1 on mobile) showcasing 6 project cards
- Each card includes:
  - Project thumbnail image with hover effect
  - Project title and category tag
  - Brief one-line description
  - Click to view case study

**About Section:**
- Professional headshot photo
- Bio paragraph describing experience and design philosophy
- Skills/tools grid with icons (Figma, Adobe XD, React, etc.)
- "Download Resume" button

**Testimonials Section:**
- Carousel/slider showing 3 client testimonials
- Each includes client name, company, role, and quote
- Company logos

**Contact Section:**
- Clean contact form with fields: Name, Email, Message
- Social media links (LinkedIn, Dribbble, Behance, Twitter)
- Email address and location
- "Let's work together" heading

**Footer:**
- Copyright notice
- Back to top button
- Minimal design

Use a sophisticated color palette (black, white, and one accent color). Implement smooth scroll animations, hover effects, and micro-interactions. Ensure the design is fully responsive and accessible. Use Next.js and Tailwind CSS with Framer Motion for animations.
    `,
  },
  {
    Copy: 'E-commerce Store',
    Icon: <ShoppingBag className="size-4" />,
    Prompt: `
      Create a fully functional e-commerce product page for a fictional online sneaker store called "KickFlow". The page should include:

**Header Navigation:**
- Store logo
- Main menu: New Arrivals, Men, Women, Sale
- Search bar with autocomplete
- Icons: Wishlist (with count), Shopping cart (with count), User account

**Product Page Layout:**

**Left Side - Image Gallery:**
- Large main product image
- Thumbnail gallery (4-5 images) below showing different angles
- Zoom functionality on hover
- 360° view option

**Right Side - Product Details:**
- Product name: "Air Stride Pro Running Shoes"
- Star rating (4.5/5) with review count
- Price with original price struck through showing discount
- Color selector with color swatches (5 colors available)
- Size selector with size chart link (sizes 7-13)
- Quantity selector (+ and - buttons)
- Stock availability indicator
- Two prominent CTAs: "Add to Cart" and "Buy Now"
- Wishlist heart icon
- Share buttons (social media)

**Product Information Tabs:**
- Description tab with product features and benefits
- Specifications tab (Material, Weight, Care Instructions)
- Reviews tab showing customer reviews with ratings, images, and verified purchase badges
- Shipping & Returns tab with policy information

**Related Products Section:**
- Horizontal scroll carousel showing 6 similar products
- Each card shows image, name, price, and quick "Add to Cart" button

**Recently Viewed:**
- Section showing 4 recently viewed products

Include a mini shopping cart slide-out panel, toast notifications for cart actions, and loading states. Use React with Tailwind CSS and shadcn/ui components. Implement responsive design optimized for mobile shopping. Add realistic product data and reviews.
    `,
  },
  {
    Copy: 'Task Manager App',
    Icon: <ListChecks className="size-4" />,
    Prompt: `
Create an intuitive task management application similar to Todoist or Things. The app should include:

**Header:**
- App logo "TaskMaster"
- Search bar for tasks
- "Add Task" button (prominent)
- User avatar with dropdown menu

**Left Sidebar:**
- Quick Add task input at top
- Navigation sections:
  - **Today** (with count badge)
  - **Upcoming** (next 7 days)
  - **All Tasks**
  - Divider
  - **Projects** (expandable list):
    - Personal
    - Work
    - Shopping
    - Fitness
  - **Labels** (expandable):
    - Urgent
    - Important
    - Later
  - Divider
  - Settings and Preferences

**Main Content Area:**
Display tasks for "Today" view:
- Section header with date and task count
- Task list with the following for each task:
  - Checkbox (with satisfying check animation)
  - Task title (editable inline)
  - Due date picker
  - Priority flag (color-coded: red, orange, blue, none)
  - Project/label tags
  - Description (expandable)
  - Delete and edit icons on hover
- Completed tasks section (collapsed by default)

**Task Creation Modal:**
Appears when clicking "Add Task":
- Task name input
- Description textarea
- Due date picker with quick options (Today, Tomorrow, Next Week, Custom)
- Priority selector
- Project dropdown
- Label multi-select
- "Add Task" and "Cancel" buttons

**Features to Implement:**
- Drag and drop to reorder tasks
- Drag tasks between projects
- Quick filters (All, Active, Completed)
- Keyboard shortcuts hint (? key)
- Dark/light mode toggle
- Task completion celebration animation
- Local storage persistence
- Responsive design (mobile-first)

Use React with Tailwind CSS, implement smooth animations with Framer Motion, and use shadcn/ui components. Include realistic sample tasks across different categories. Add empty states with helpful illustrations when lists are empty.
    `,
  },
]
