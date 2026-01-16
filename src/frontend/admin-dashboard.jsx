import React, { useState, useEffect, useRef } from "react";
import { 
  IoMdHome, 
  IoMdClose, 
  IoMdNotifications, 
  IoMdMegaphone,
  IoMdCheckmarkCircle,
  IoMdTime,
  IoMdSend,
  IoMdCreate
} from "react-icons/io";
import { 
  MdDashboard, 
  MdLocationOn, 
  MdReportProblem, 
  MdMenu, 
  MdAdd, 
  MdEvent, 
  MdAnnouncement,
  MdCheckCircle,
  MdPerson,
  MdWork,
  MdCalendarToday,
  MdAddTask,
  MdBook,
  MdBookmarkAdd,
  MdChat,
  MdComment,
  MdPushPin,
  MdAssignment,
  MdEdit,
  MdDelete,
  MdPriorityHigh,
  MdPeople,
  MdChatBubble,
  MdDoneAll
} from "react-icons/md";
import { 
  FaUser, 
  FaSignOutAlt, 
  FaRegCalendarAlt, 
  FaRegNewspaper,
  FaRegBell,
  FaMapMarkerAlt,
  FaPlus,
  FaRegCommentDots
} from "react-icons/fa";
import { 
  FiSettings, 
  FiChevronRight, 
  FiPlus, 
  FiChevronLeft, 
  FiCamera,
  FiPaperclip,
  FiBell,
  FiSearch,
  FiFilter,
  FiMessageSquare
} from "react-icons/fi";
import { 
  HiOutlineChatAlt2,
  HiOutlineClipboardList,
  HiOutlineDocumentAdd
} from "react-icons/hi";
import Swal from "sweetalert2";

const AdminDashboard = ({ user, logout }) => {
  const [currentUser, setCurrentUser] = useState(user);

  // Sync currentUser with prop changes
  useEffect(() => {
    setCurrentUser(user);
  }, [user]);
  const [activeTab, setActiveTab] = useState("Home");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  // Navigation stack for screen-based navigation (replaces modals)
  const [navigationStack, setNavigationStack] = useState([]);
  const [currentLocation, setCurrentLocation] = useState("Office");
  const [reportMessage, setReportMessage] = useState("");
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [announcementType, setAnnouncementType] = useState("general");
  const [announcementPriority, setAnnouncementPriority] = useState("medium");
  const [commentText, setCommentText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [userStatus, setUserStatus] = useState("Active");
  const [profileOpen, setProfileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showAnnouncementFilterMenu, setShowAnnouncementFilterMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("unread");
  const [dateFilter, setDateFilter] = useState("all");
  const [showDateFilterMenu, setShowDateFilterMenu] = useState(false);
  const [customDateRange, setCustomDateRange] = useState({ start: null, end: null });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const actionMenuRef = useRef(null);
  const fileInputRef = useRef(null);
  const commentFileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [commentAttachments, setCommentAttachments] = useState([]);
  const [showCameraModal, setShowCameraModal] = useState(false);
  // State for announcements, projects, users - must be declared before useEffect hooks
  const [projects, setProjects] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [readComments, setReadComments] = useState(() => {
    try {
      const saved = localStorage.getItem('adminDashboardReadComments');
      return saved ? JSON.parse(saved) : {};
    } catch (err) {
      console.error('Error loading read comments:', err);
      return {};
    }
  });

  // Prevent body scroll when date picker modal is open
  useEffect(() => {
    if (showDatePicker) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showDatePicker]);
  const [cameraStream, setCameraStream] = useState(null);

  // Project modal states
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectStatus, setProjectStatus] = useState("pending");
  const [projectDeadline, setProjectDeadline] = useState("");
  const [projectManager, setProjectManager] = useState("");
  const [projectBudget, setProjectBudget] = useState("");
  const [projectStartDate, setProjectStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const [center, setCenter] = useState({
    lat: 14.5995,
    lng: 120.9842,
  });

  // Navigation Stack Functions
  const pushScreen = (screenName, data = {}) => {
    setNavigationStack(prev => [...prev, { screen: screenName, data }]);
  };

  const popScreen = () => {
    setNavigationStack(prev => prev.slice(0, -1));
  };

  const getCurrentScreen = () => {
    return navigationStack.length > 0 ? navigationStack[navigationStack.length - 1] : null;
  };

  const isScreenOpen = (screenName) => {
    return navigationStack.some(item => item.screen === screenName);
  };
  
// Format author name from email
const formatAuthorName = (email) => {
  if (!email) return "Unknown";

  return email
    .split("@")[0]            // remove domain
    .replace(/\d+/g, "")      // remove numbers
    .replace(/\b\w/g, c => c.toUpperCase()); // capitalize
};

// Format numbers as Philippine Peso with comma grouping
const formatPeso = (value) => {
  if (value === null || value === undefined || value === "") return "₱0";
  const num = typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ""));
  if (isNaN(num)) return "₱0";
  return "₱" + num.toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

// Treat tasks as new for 3 days from start date; if no date, assume new when progress is 0
const isProjectNew = (dateValue, progress) => {
  if (dateValue) {
    const start = new Date(dateValue);
    if (!isNaN(start)) {
      const diffDays = (Date.now() - start.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays <= 3) return true;
    }
  }
  return progress === undefined || progress === null || Number(progress) === 0;
};

// Get icon for announcement type
const getIconForType = (type) => {
  switch (type) {
    case "meeting": return <MdCalendarToday className="text-white" size={18} />;
    case "deadline": return <IoMdTime className="text-white" size={18} />;
    case "safety": return <HiOutlineClipboardList className="text-white" size={18} />;
    case "update": return <MdAnnouncement className="text-white" size={18} />;
    case "question": return <MdChat className="text-white" size={18} />;
    default: return <MdChatBubble className="text-white" size={18} />;
  }
};

// Get color for announcement type
const getColorForType = (type) => {
  switch (type) {
    case "meeting": return "red";
    case "deadline": return "red";
    case "safety": return "green";
    case "update": return "purple";
    case "question": return "yellow";
    default: return "blue";
  }
};

// Format time ago
const formatTimeAgo = (dateString) => {
  const created = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now - created) / 1000);

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) !== 1 ? 's' : ''} ago`;
  return created.toLocaleDateString();
};


  // Get user's current geolocation
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => console.log("Location access denied")
    );
  }, []);

  // 🔒 Helper function to check for session expiry and auto-logout
  const handleApiResponse = async (response) => {
    if (!response.ok) {
      return response.json().then(data => {
        if (data.message === "Unauthorized") {
          console.error("Session expired - logging out");
          logout();
        }
        throw new Error(data.message || "API request failed");
      });
    }
    return response.json();
  };

  // Enhanced announcements data
  useEffect(() => {
    setIsLoadingAnnouncements(true);
    fetch("/backend/announcements.php", { credentials: "include" })
      .then(res => handleApiResponse(res))
      .then(data => {
        if (!Array.isArray(data)) {
          console.error('Announcements data is not an array:', data);
          setAnnouncements([]);
          setIsLoadingAnnouncements(false);
          return;
        }
        
        const normalized = data.map(a => ({
          id: a.announcement_id,
          title: a.title,
          content: a.content,
          type: a.type,
          priority: a.priority,
          author: formatAuthorName(a.author),
          time: formatTimeAgo(a.created_at),
          unread: a.unread === 1,
          is_pinned: a.is_pinned === 1,
          category: a.type.charAt(0).toUpperCase() + a.type.slice(1),
          important: a.priority === "high",
          color: getColorForType(a.type),
          icon: getIconForType(a.type),
          created_at: a.created_at,
        }));

        setAnnouncements(normalized);
        setIsLoadingAnnouncements(false);
      })
      .catch(err => {
        console.error('Failed to fetch announcements:', err);
        setAnnouncements([]);
        setIsLoadingAnnouncements(false);
      });
  }, [logout]);

  // Save read comments to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('adminDashboardReadComments', JSON.stringify(readComments));
    } catch (err) {
      console.error('Error saving read comments:', err);
    }
  }, [readComments]);

  // Fetch users
  useEffect(() => {
    fetch("/backend/users.php", {
      credentials: "include",
    })
      .then(res => handleApiResponse(res))
      .then(data => setUsers(data))
      .catch(err => console.error("Users error:", err));
  }, [logout]);

  // Initial loading management - hide loading screen after data is fetched
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500); // Minimum loading time for smooth UX
    return () => clearTimeout(timer);
  }, []);

  //================================================== Filtered announcements ==================================================
  const filteredAnnouncements = announcements.filter(ann => {
    if (selectedFilter === "unread") return ann.unread;
    if (selectedFilter === "important") return ann.important;
    if (selectedFilter === "pinned") return ann.pinned;
    if (selectedFilter === "all") return true;
    return true;
  }).filter(ann => {
    // Date filter logic
    const announcementDate = new Date(ann.created_at);
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);
    
    if (dateFilter === "today") {
      return announcementDate >= startOfToday && announcementDate < endOfToday;
    }
    if (dateFilter === "week") {
      return announcementDate >= startOfWeek && announcementDate <= endOfWeek;
    }
    if (dateFilter === "month") {
      return announcementDate >= startOfMonth && announcementDate <= endOfMonth;
    }
    if (dateFilter === "custom" && customDateRange.start && customDateRange.end) {
      const startDate = new Date(customDateRange.start);
      const endDate = new Date(customDateRange.end);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      return announcementDate >= startDate && announcementDate <= endDate;
    }
    return true;
  }).filter(ann => 
    ann.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ann.content.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return Number(b.is_pinned) - Number(a.is_pinned);
    return new Date(b.created_at) - new Date(a.created_at);
  });

//============================================= Create new announcement =================================================
const createAnnouncement = async () => {
  const newAnnouncement = {
    title: announcementTitle,
    content: announcementContent,
    type: announcementType,
    priority: announcementPriority,
  };

  try {
    const response = await fetch("/backend/announcements.php", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newAnnouncement),
    });

    const data = await response.json();
  if (data.status === "success") {
  fetch("/backend/announcements.php", { credentials: "include" })
    .then(res => handleApiResponse(res))
    .then(data => {
      const normalized = data.map(a => ({
        id: a.announcement_id,
        title: a.title,
        content: a.content,
        type: a.type,
        priority: a.priority,
        author: a.author === "admin" ? "Admin" : a.author,
        time: formatTimeAgo(a.created_at),
        unread: a.unread === 1,
        category: a.type.charAt(0).toUpperCase() + a.type.slice(1),
        important: a.priority === "high",
        color: getColorForType(a.type),
        icon: getIconForType(a.type),
      }));

      setAnnouncements(normalized);
    });

  setShowAnnouncementModal(false);
}
  } catch (error) {
    console.error("Error creating announcement:", error);
  }
};

//============================================= Create new project/Tasks =================================================
const createProject = async () => {
  const newProject = {
    title: projectTitle,
    description: projectDescription,
    status: projectStatus,
    deadline: projectDeadline,
    manager: projectManager,
    team_users: selectedUsers.length,
    budget: projectBudget,
    startDate: projectStartDate,
    assignedUsers: selectedUsers,
  };

  try {
    const response = await fetch("/backend/projects.php", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newProject),
    });

    const data = await response.json();
    if (data.status === "success") {
      // Fetch projects again
      fetch("/backend/projects.php", {
        credentials: "include",
      })
        .then(res => handleApiResponse(res))
        .then(data => setProjects(data))
        .catch(err => console.error("Projects error:", err));

      setShowProjectModal(false);
      // Reset form
      setProjectTitle("");
      setProjectDescription("");
      setProjectStatus("pending");
      setProjectDeadline("");
      setProjectManager("");
      setProjectBudget("");
      setProjectStartDate(new Date().toISOString().split('T')[0]);
      setSelectedUsers([]);
    }
  } catch (error) {
    console.error("Error creating project:", error);
  }
};

const handleBudgetChange = (e) => {
  const value = e.target.value;
  // Remove all non-numeric characters except the peso sign
  const numericValue = value.replace(/[^0-9]/g, '');
  
  if (numericValue === '') {
    setProjectBudget('');
    return;
  }
  
  // Format with commas
  const formatted = Number(numericValue).toLocaleString('en-PH');
  setProjectBudget(formatted);
};
  
 const Avatar = ({ user, size = 32, className = "" }) => {
  const initial =
    user?.name?.charAt(0) ||
    user?.email?.charAt(0) ||
    "?";

  const [imgError, setImgError] = useState(false);

  // PRIORITY: uploaded → google → fallback
  const imageSrc =
    user?.uploaded_profile_image ||
    user?.profile_image ||
    null;

  if (!imageSrc || imgError) {
    return (
      <div
        className={`bg-blue-500 text-white font-bold flex items-center justify-center rounded-full ${className}`.trim()}
        style={{ width: size, height: size }}
      >
        {initial.toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt="Profile"
      onError={() => setImgError(true)}
      referrerPolicy="no-referrer" // 🔥 REQUIRED FOR GOOGLE
      className={`rounded-full object-cover ${className}`.trim()}
      style={{ width: size, height: size }}
    />
  );
};

  //================================================== Mark announcement as read =================================================
const markAsRead = async (id) => {
  try {
    const res = await fetch("/backend/mark_read.php", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ announcement_id: id }),
    });

    const data = await res.json();
    if (data.status !== "success") {
      console.error("Mark as read failed:", data.message);
    }

    setAnnouncements(prev =>
      prev.map(a => a.id === id ? { ...a, unread: false } : a)
    );
  } catch (err) {
    console.error("Mark as read error:", err);
  }
};

  //======================================================= Mark all as read =================================================
  const markAllAsRead = async () => {
    try {
      // Reuse the single-item endpoint for all announcements
      await Promise.all(announcements.map(a => markAsRead(a.id)));
    } catch (err) {
      console.error("Mark all as read error:", err);
    }
  };

  // Toggle pin state for an announcement
  const togglePin = async (id, nextPinned) => {
    try {
      const res = await fetch("/backend/announcements.php", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pin", id, pinned: nextPinned })
      });
      const data = await handleApiResponse(res);
      if (data.status !== "success") {
        console.error("Pin update failed:", data.message);
        return;
      }
      setAnnouncements(prev => {
        const updated = prev.map(a => a.id === id ? { ...a, pinned: nextPinned } : a);
        return [...updated].sort((a, b) => (b.pinned - a.pinned));
      });
    } catch (err) {
      console.error("Toggle pin error:", err);
    }
  };

  const getCommentTimeAgo = (timestamp) => {
    if (!timestamp) return "Just now";
    return formatTimeAgo(timestamp);
  };

  // Location history
  const [locationHistory, setLocationHistory] = useState([
    { id: "1", location: "Main Office", time: "09:00 AM", date: "2024-12-10" },
    { id: "2", location: "Site A", time: "10:30 AM", date: "2024-12-10" },
    { id: "3", location: "Client Office", time: "02:00 PM", date: "2024-12-10" },
    { id: "4", location: "Site B", time: "04:45 PM", date: "2024-12-10" },
  ]);

  //========================================================== useEffect ==========================================================
  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
        setShowActionMenu(false);
      }
    };

    if (showActionMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showActionMenu]);

  // Reset selectedUsers when project modal opens
  useEffect(() => {
    if (showProjectModal) {
      setSelectedUsers([]);
    }
  }, [showProjectModal]);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => alert("Location access denied")
    );
  }, []);


useEffect(() => {
  const fetchProjectsWithComments = async () => {
    setIsLoadingProjects(true);
    try {
      const res = await fetch("/backend/projects.php", { credentials: "include" });
      const data = await handleApiResponse(res);

      if (!Array.isArray(data)) {
        console.error('Projects data is not an array:', data);
        setProjects([]);
        setIsLoadingProjects(false);
        return;
      }

      const normalizedProjects = data.map(project => ({
        id: project.id || project.project_id,
        title: project.title,
        description: project.description || "",
        status: project.status || "pending",
        progress: project.progress || 0,
        deadline: project.deadline || "",
        manager: project.manager || "",
        budget: project.budget || 0,
        team_users: project.team_users || 0,
        assignedUsers: project.assignedUsers || project.assigned_users || [],
        comments: [],
        isNew: isProjectNew(project.startDate || project.start_date || project.created_at, project.progress),
      }));

      const projectsWithComments = await Promise.all(
        normalizedProjects.map(async (project) => {
          try {
            const commentsRes = await fetch(`/backend/comments.php?project_id=${project.id}`, { 
              credentials: "include" 
            });
            const commentsData = await handleApiResponse(commentsRes);
            const comments = commentsData.status === "success" 
              ? (commentsData.comments || []).map(c => ({
                  id: c.comment_id,
                  text: c.comment,
                  attachments: c.attachments || null,
                  time: getCommentTimeAgo(c.created_at),
                  created_at: c.created_at,
                  email: c.email,
                  profile_image: c.profile_image,
                  user: c.user || formatAuthorName(c.email),
                }))
              : [];
            const isNew = isProjectNew(project.startDate || project.start_date || project.created_at, project.progress);
            return { ...project, comments, isNew };
          } catch (err) {
            console.error(`Failed to fetch comments for project ${project.id}:`, err);
            const isNew = isProjectNew(project.startDate || project.start_date || project.created_at, project.progress);
            return { ...project, comments: [], isNew };
          }
        })
      );

      setProjects(projectsWithComments);
      setIsLoadingProjects(false);
    } catch (err) {
      console.error("Projects error:", err);
      setIsLoadingProjects(false);
    }
  };
  
  fetchProjectsWithComments();
}, []);

  //========================================================== Update location ==========================================================
  const updateLocation = (location) => {
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const date = now.toLocaleDateString();

    setCurrentLocation(location);
    setLocationHistory(prev => [{ id: Date.now().toString(), location, time, date }, ...prev.slice(0, 9)]);
    setShowLocationModal(false);
    alert(`Location Updated: Your location has been set to ${location}`);
  };

  const submitReport = () => {
    if (!reportMessage.trim()) return alert("Please enter a report message");
    alert("Report Submitted: Your report has been sent to admin");
    setReportMessage("");
    setShowReportModal(false);
    setShowActionMenu(false);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "ongoing": return "bg-green-500";
      case "completed": return "bg-blue-500";
      case "scheduled": return "bg-yellow-500";
      case "pending": return "bg-violet-500";
      default: return "bg-gray-500";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case "high": return "bg-red-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getCategoryColor = (color) => {
    switch (color) {
      case "blue": return "bg-gradient-to-br from-blue-500 to-blue-600";
      case "red": return "bg-gradient-to-br from-red-500 to-red-600";
      case "green": return "bg-gradient-to-br from-green-500 to-green-600";
      case "purple": return "bg-gradient-to-br from-purple-500 to-purple-600";
      case "yellow": return "bg-gradient-to-br from-yellow-500 to-yellow-600";
      default: return "bg-gradient-to-br from-gray-500 to-gray-600";
    }
  };

  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-600";
      case "medium": return "bg-yellow-100 text-yellow-600";
      case "low": return "bg-green-100 text-green-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const handleProfileClick = () => {
    if (isMobile) {
      setProfileOpen(true);
    } else {
      setProfileOpen(prev => !prev);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (profileOpen) setProfileOpen(false);
    if (showActionMenu) setShowActionMenu(false);
  };

  const viewProjectDetails = async (project) => {
    // Prime selected project immediately
    setSelectedProject({ ...project, comments: project.comments || [] });
    pushScreen("projectDetails", { project });

    // Fetch fresh comments for this project
    try {
      const res = await fetch(`/backend/comments.php?project_id=${project.id}`, { credentials: "include" });
      const data = await handleApiResponse(res);
      if (data.status === "success") {
        const mapped = (data.comments || []).map((c) => ({
          id: c.comment_id,
          text: c.comment,
          attachments: c.attachments || null,
          time: getCommentTimeAgo(c.created_at),
          created_at: c.created_at,
          email: c.email,
          profile_image: c.profile_image,
          user: c.user || formatAuthorName(c.email),
        }));

        setSelectedProject(prev => prev ? { ...prev, comments: mapped } : prev);
        setProjects(prev => prev.map(p => p.id === project.id ? { ...p, comments: mapped } : p));
      }
    } catch (err) {
      console.error("Project comments fetch error:", err);
    }
  };

  //========================================================== Add Comment ==========================================================
  const addComment = async (projectId) => {
    if (!commentText.trim() && commentAttachments.length === 0) return;

    setIsSending(true);

    const formData = new FormData();
    formData.append("project_id", projectId);
    formData.append("text", commentText);

    // Append actual files
    commentAttachments.forEach((attachment, index) => {
      formData.append("attachments[]", attachment.rawFile);
    });

    try {
      const response = await fetch("/backend/comments.php", {
        method: "POST",
        credentials: "include",
        body: formData, // FormData handles multipart/form-data automatically
      });

      const data = await response.json();
      if (data.status === "success") {
        // Create new comment with attachment file paths
        const newCommentObj = {
          id: data.comment_id || Date.now(),
          user: data.user || "Admin",
          text: commentText,
          time: "Just now",
          created_at: new Date().toISOString(),
          profile_image: data.profile_image || currentUser?.profile_image,
          email: data.email || currentUser?.email,
          attachments: data.attachments || null, // Get file paths from backend
        };

        // Update the local project with the new comment
        const updatedProjects = projects.map(project => {
          if (project.id === projectId) {
            return {
              ...project,
              comments: [...project.comments, newCommentObj]
            };
          }
          return project;
        });
        
        setProjects(updatedProjects);
        
        // Update selectedProject if it's the current one
        if (selectedProject && selectedProject.id === projectId) {
          setSelectedProject({
            ...selectedProject,
            comments: [...selectedProject.comments, newCommentObj]
          });
        }
        
        setCommentText("");
        setCommentAttachments([]);
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to add comment. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const addUserToProject = async (userId, userName) => {
    // Check if user is already assigned
    if (selectedProject?.assignedUsers?.includes(String(userId))) {
      Swal.fire({
        title: "User Already Assigned",
        text: `${userName} is already assigned to this project.`,
        icon: "info",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    // Confirmation dialog
    const result = await Swal.fire({
      title: "Add User to Project",
      text: `Are you sure you want to add ${userName} to this project?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, add user",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const formData = new FormData();
      formData.append("project_id", selectedProject.id);
      formData.append("user_id", userId);
      formData.append("action", "add");

      const response = await fetch("/backend/projects.php", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Invalid JSON response:", responseText);
        throw new Error("Server returned invalid response. Please try again.");
      }

      if (data.status === "success") {
        // Update UI
        const updatedUsers = [...(selectedProject.assignedUsers || []), String(userId)];
        setSelectedProject({
          ...selectedProject,
          assignedUsers: updatedUsers,
          team_users: updatedUsers.length,
        });

        // Update projects list
        setProjects(prev =>
          prev.map(p =>
            p.id === selectedProject.id
              ? { ...p, assignedUsers: updatedUsers, team_users: updatedUsers.length }
              : p
          )
        );

        setShowAddUserToProjectModal(false);

        Swal.fire({
          title: "Success",
          text: `${userName} has been added to the project`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        throw new Error(data.message || "Failed to add user");
      }
    } catch (error) {
      console.error("Error adding user:", error);
      Swal.fire({
        title: "Error",
        text: error.message || "Failed to add user to project",
        icon: "error",
      });
    }
  };

  const removeUserFromProject = async (userId, userName) => {
    // Confirmation dialog
    const result = await Swal.fire({
      title: "Remove User from Project",
      text: `Are you sure you want to remove ${userName} from this project?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, remove user",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const formData = new FormData();
      formData.append("project_id", selectedProject.id);
      formData.append("user_id", userId);
      formData.append("action", "remove");

      const response = await fetch("/backend/projects.php", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Invalid JSON response:", responseText);
        throw new Error("Server returned invalid response. Please try again.");
      }

      if (data.status === "success") {
        // Update UI
        const updatedUsers = selectedProject.assignedUsers.filter(
          (u) => String(u) !== String(userId)
        );
        setSelectedProject({
          ...selectedProject,
          assignedUsers: updatedUsers,
          team_users: updatedUsers.length,
        });

        // Update projects list
        setProjects(prev =>
          prev.map(p =>
            p.id === selectedProject.id
              ? { ...p, assignedUsers: updatedUsers, team_users: updatedUsers.length }
              : p
          )
        );

        Swal.fire({
          title: "Removed",
          text: `${userName} has been removed from the project`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        throw new Error(data.message || "Failed to remove user");
      }
    } catch (error) {
      console.error("Error removing user:", error);
      Swal.fire({
        title: "Error",
        text: error.message || "Failed to remove user from project",
        icon: "error",
      });
    }
  };

  const handleCommentFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newAttachments = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        newAttachments.push({
          name: file.name,
          size: file.size,
          type: file.type,
          rawFile: file // Store the actual file object
        });
      }
      setCommentAttachments(prev => [...prev, ...newAttachments]);
    }
    // Reset input
    if (commentFileInputRef.current) {
      commentFileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index) => {
    setCommentAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' },
        audio: false 
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCameraModal(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const timestamp = new Date().getTime();
          const file = new File([blob], `camera-${timestamp}.jpg`, { type: 'image/jpeg' });
          
          setCommentAttachments(prev => [...prev, {
            name: file.name,
            preview: URL.createObjectURL(blob),
            size: file.size,
            type: file.type,
            rawFile: file
          }]);
          
          stopCamera();
        }
      }, 'image/jpeg', 0.9);
    }
  };

  // Auto-refresh comments when modal is open
  useEffect(() => {
    if (!showCommentsModal || !selectedProject?.id) return;

    const refreshComments = async () => {
      try {
        const res = await fetch(`/backend/comments.php?project_id=${selectedProject.id}`, { credentials: "include" });
        const data = await handleApiResponse(res);
        if (data.status === "success") {
          const mapped = (data.comments || []).map((c) => ({
            id: c.comment_id,
            text: c.comment,
            time: getCommentTimeAgo(c.created_at),
            created_at: c.created_at,
            email: c.email,
            profile_image: c.profile_image,
            user: c.user || formatAuthorName(c.email),
            attachments: c.attachments || null,
          }));

          setSelectedProject(prev => prev ? { ...prev, comments: mapped } : prev);
          setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, comments: mapped } : p));
        }
      } catch (err) {
        console.error("Auto-refresh comments error:", err);
      }
    };

    // Refresh every 3 seconds
    const interval = setInterval(refreshComments, 3000);
    return () => clearInterval(interval);
  }, [showCommentsModal, selectedProject?.id]);

  //========================================================== Render Functions ==========================================================
  const renderAnnouncementCard = (announcement) => (
    <div 
      key={announcement.id} 
      className={`relative bg-white rounded-2xl p-4 mb-3 shadow-lg hover:shadow-xl transition-all duration-300 ${
        announcement.unread ? 'border-l-4 border-blue-500' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-xl ${getCategoryColor(announcement.color)} flex items-center justify-center mr-3`}>
            {announcement.icon}
          </div>
          <div>
            <h4 className="font-bold text-gray-800">{announcement.title}</h4>
            <div className="flex items-center mt-1">
              <span className="text-xs text-gray-500">{announcement.category}</span>
              <span className={`ml-2 px-2 py-0.5 ${getPriorityBadgeColor(announcement.priority)} text-xs rounded-full font-medium`}>
                {announcement.priority} Priority
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {announcement.unread && (
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          )}
          <button 
            onClick={() => togglePin(announcement.id, !announcement.pinned)}
            className={(announcement.pinned ? "text-red-500" : "text-gray-400") + " hover:text-yellow-600"}
            title={announcement.pinned ? "Unpin" : "Pin"}
          >
            <MdPushPin size={18} />
          </button>
        </div>
      </div>
      
      {/* Content */}
      <p className="text-gray-600 text-sm mb-3">{announcement.content}</p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-4">
          <span className="text-xs text-gray-500 flex items-center">
            <IoMdTime className="mr-1" size={14} />
            {announcement.time}
          </span>
          <span className="text-xs text-gray-500">By: {formatAuthorName(announcement.author)}</span>
        </div>
        <div className="flex items-center">
          {announcement.unread ? (
            <button 
              onClick={() => markAsRead(announcement.id)}
              className="text-xs text-blue-500 font-medium hover:text-blue-600"
            >
              Mark as read
            </button>
          ) : (
            <div className="flex items-center text-gray-500 text-sm">
              <IoMdCheckmarkCircle size={16} className="mr-1" />
              <span>Read</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const getUnreadCommentCount = (projectId) => {
    const projectReadComments = readComments[projectId] || [];
    const projectComments = projects.find(p => p.id === projectId)?.comments || [];
    return projectComments.filter(c => !projectReadComments.includes(c.id)).length;
  };

  const renderProjectCard = (item) => {
    const unreadCount = getUnreadCommentCount(item.id);
    return (
      <div key={item.id} className="relative bg-white rounded-2xl p-4 mb-3 shadow-lg hover:shadow-xl transition-all">
        {item.isNew && (
          <span className="absolute -top-1 -left-1 px-2 py-1 rounded-full text-[10px] font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg z-10">
            New
          </span>
        )}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center flex-1">
            <div className="ml-3">
              <h4 className="font-bold text-gray-800">{item.title}</h4>
              <p className="text-xs text-gray-500">Managed by {item.manager}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full ${getStatusColor(item.status)} text-white text-xs`}>
            {item.status}
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span></span>
            <span className="font-bold">{item.progress}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${getStatusColor(item.status)}`}
              style={{ width: `${item.progress}%` }}
            ></div>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs text-gray-500">
            <div>Deadline: <span className="font-medium">{item.deadline}</span></div>
             <div>Budget: <span className="font-medium">{formatPeso(item.budget)}</span></div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setSelectedProject({ ...item, comments: item.comments || [] });
                setShowCommentsModal(true);
                // Mark all comments as read for this project
                if (item && item.comments) {
                  const commentIds = item.comments.map(c => c.id);
                  setReadComments(prev => ({
                    ...prev,
                    [item.id]: commentIds
                  }));
                }
              }}
              className="flex items-center text-xs text-gray-500 relative hover:text-blue-500 transition-colors"
            >
              <MdComment size={14} className="mr-1" />
              {item.comments.length}
              {getUnreadCommentCount(item.id) > 0 && (
                <div className="absolute -top-0.5 -right-0.1 w-2 h-2 bg-red-500 rounded-full"></div>
              )}
            </button>
            <button 
              onClick={() => viewProjectDetails(item)}
              className="text-blue-500 text-sm font-medium flex items-center"
            >
              Details <FiChevronRight size={16} className="ml-1" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderProjectDetailsModal = () => (
    <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-slide-in-right">
      {/* Header with Back Button */}
      <div className="sticky top-0 z-20 bg-white px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <button 
          onClick={popScreen}
          className="p-2 rounded-full hover:bg-gray-100 mr-3"
        >
          <FiChevronLeft size={24} className="text-gray-700" />
        </button>
        <h3 className="flex-1 text-lg font-bold text-gray-800">Tasks Details</h3>
        {selectedProject && (
          <span className={`px-3 py-1 rounded-full ${getStatusColor(selectedProject.status)} text-white text-xs inline-block flex-shrink-0`}>
            {selectedProject.status}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        
        {selectedProject && (
          <>
            {/* Title and Status */}
            <div className="flex flex-row items-start sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-gray-200">
              <h4 className="text-lg font-bold text-gray-800 flex-1">{selectedProject.title}</h4>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-6">
              {/* Left Column */}
              <div className="space-y-3 sm:space-y-5">
                {/* Assigned Employees */}
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2 sm:mb-3 uppercase tracking-wide">Assigned Employees</p>
                  <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200 min-h-[150px] sm:min-h-[200px] overflow-y-auto flex flex-wrap gap-1 sm:gap-2 items-start content-start">
                    {users.length > 0 && selectedProject.assignedUsers && selectedProject.assignedUsers.length > 0 ? selectedProject.assignedUsers.map(userId => {
                      const user = users.find(u => String(u.id) === String(userId));
                      return user ? (
                        <div key={userId} className="flex items-center bg-blue-100 text-blue-800 px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs">
                          <Avatar user={user} size={32} />
                          <span className="ml-0.5 sm:ml-1 hidden sm:inline"> {formatAuthorName(user.email || user.name)}</span>
                        </div>
                      ) : null;
                    }) : <p className="text-sm text-gray-500 w-full">None</p>}
                  </div>
                </div>

                {/* Description - Hidden on Mobile, Shown on Desktop */}
                <div className="hidden sm:block">
                  <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Description</p>
                  <p className="text-gray-600 text-sm bg-gray-50 rounded-lg p-3 border border-gray-200">{selectedProject.description}</p>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-3 sm:space-y-5">
                {/* Manager */}
                <div className="bg-white rounded-lg p-2 sm:p-4 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 mb-1 sm:mb-2 uppercase tracking-wide">Manager</p>
                  <p className="font-semibold text-gray-800 text-xs sm:text-sm truncate">{selectedProject.manager}</p>
                </div>

                {/* Team Users */}
                <div className="bg-white rounded-lg p-2 sm:p-4 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 mb-1 sm:mb-2 uppercase tracking-wide">Team Users</p>
                  <p className="font-semibold text-gray-800 text-xs sm:text-sm">{selectedProject.team_users || 0} users</p>
                </div>

                {/* Budget */}
                <div className="bg-white rounded-lg p-2 sm:p-4 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 mb-1 sm:mb-2 uppercase tracking-wide">Budget</p>
                  <p className="font-semibold text-gray-800 text-xs sm:text-sm truncate">{formatPeso(selectedProject.budget)}</p>
                </div>

                {/* Deadline */}
                <div className="bg-white rounded-lg p-2 sm:p-4 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 mb-1 sm:mb-2 uppercase tracking-wide">Deadline</p>
                  <p className="font-semibold text-gray-800 text-xs sm:text-sm">{selectedProject.deadline}</p>
                </div>
              </div>
            </div>

            {/* Description - Full Width on Mobile */}
            <div className="sm:hidden mb-6">
              <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Description</p>
              <p className="text-gray-600 text-sm bg-gray-50 rounded-lg p-3 border border-gray-200">{selectedProject.description}</p>
            </div>

            {/* Comments Section - Preview */}
            <div className="mb-6">
              <button
                onClick={() => {
                  setShowCommentsModal(true);
                  // Reset navigation stack when opening comments
                  setNavigationStack([]);
                  // Mark all comments as read for this project
                  if (selectedProject && selectedProject.comments) {
                    const commentIds = selectedProject.comments.map(c => c.id);
                    setReadComments(prev => ({
                      ...prev,
                      [selectedProject.id]: commentIds
                    }));
                  }
                }}
                className="w-full bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl p-4 transition-all border border-blue-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-blue-500 p-3 rounded-full mr-3 relative">
                      <MdComment className="text-white" size={24} />
                      {getUnreadCommentCount(selectedProject?.id) > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center ">
                          {getUnreadCommentCount(selectedProject?.id)}
                        </div>
                      )}
                    </div>
                    <div className="text-left">
                      <h4 className="text-md font-bold text-gray-800">Comments & Clarifications</h4>
                      <p className="text-sm text-gray-600">
                        {selectedProject.comments.length > 0 
                          ? `${selectedProject.comments.length} comment${selectedProject.comments.length !== 1 ? 's' : ''}`
                          : 'No comments yet. Start a conversation'}
                      </p>
                    </div>
                  </div>
                  <FiChevronRight size={24} className="text-blue-500" />
                </div>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );const renderCommentsModal = () => (
  <div className="fixed inset-0 bg-white z-[60] flex flex-col">
    {/* Messenger-style Header */}
      <div className="sticky top-0 z-20 bg-white px-4 py-3 flex items-center border-b border-gray-200 shadow-sm">
        <button 
        onClick={() => setShowCommentsModal(false)}
        className="p-2 rounded-full hover:bg-gray-100 mr-2 transition-colors flex-shrink-0"
        >
        <FiChevronLeft size={24} className="text-gray-700" />
        </button>
        
        <Avatar 
        user={currentUser}
        size={40}
        className="flex-shrink-0 mr-2"
        />
        
         <div className="flex-1 min-w-0 ml-2">
        <h3 className="text-base font-bold text-gray-900 truncate">{selectedProject?.title}</h3>
        <p className="text-xs text-gray-500 truncate flex items-center gap-1">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          Active now
        </p>
        </div>
        
        <button className="p-2 rounded-full hover:bg-gray-100 transition-colors ml-2">
        <FiSearch size={20} className="text-gray-600" />
        </button>
        
        <button 
        onClick={() => pushScreen("projectUsers")}
        className="p-2 rounded-full hover:bg-gray-100 transition-colors ml-2"
        title="View and manage project users"
        >
        <MdPeople size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Navigation Stack - Screen-based Navigation */}
      {navigationStack.length > 0 && (
        <div className="fixed inset-0 bg-white z-40 flex flex-col animate-slide-in-right">
          {/* Dynamic Header */}
          <div className="sticky top-0 z-20 bg-white px-5 py-4 border-b border-gray-200 flex items-center">
            <button 
              onClick={popScreen}
              className="p-2 rounded-full hover:bg-gray-100 mr-3"
            >
              <FiChevronLeft size={24} className="text-gray-700" />
            </button>
            <h3 className="text-lg font-bold text-gray-800">
              {getCurrentScreen()?.screen === "projectUsers" ? "Project Team" : "Add Users to Project"}
            </h3>
          </div>

          {/* Dynamic Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* Project Users Screen */}
            {getCurrentScreen()?.screen === "projectUsers" && (
              <div className="space-y-4">
                {/* Add User Button */}
                <button
                  onClick={() => pushScreen("addUserToProject")}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium flex items-center justify-center hover:from-blue-600 hover:to-blue-700 transition-all"
                >
                  <MdAdd size={20} className="mr-2" />
                  Add User to Project
                </button>

                {/* Current Team Members */}
                <div>
                  <h4 className="font-bold text-gray-800 mb-4">Team Members</h4>
                  <div className="space-y-3">
                    {selectedProject?.assignedUsers && selectedProject.assignedUsers.length > 0 ? (
                      selectedProject.assignedUsers.map(userId => {
                        const user = users.find(u => String(u.id) === String(userId));
                        return user ? (
                          <div key={userId} className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <div className="flex items-center flex-1">
                              <Avatar user={user} size={40} />
                              <div className="ml-3 flex-1">
                                <p className="font-medium text-gray-800">{formatAuthorName(user.email || user.name)}</p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => removeUserFromProject(user.id, formatAuthorName(user.email || user.name))}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                              title="Remove user"
                            >
                              <IoMdClose size={20} />
                            </button>
                          </div>
                        ) : null;
                      })
                    ) : (
                      <div className="text-center py-8">
                        <MdPeople size={40} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-gray-600 font-medium">No users assigned</p>
                        <p className="text-sm text-gray-400">Add users to this project</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Add User to Project Screen */}
            {getCurrentScreen()?.screen === "addUserToProject" && (
              <div className="space-y-3">
                {users.filter(user => !selectedProject?.assignedUsers?.includes(String(user.id))).length > 0 ? (
                  users.filter(user => !selectedProject?.assignedUsers?.includes(String(user.id))).map(user => (
                    <button
                      key={user.id}
                      onClick={() => addUserToProject(user.id, formatAuthorName(user.email || user.name))}
                      className="w-full flex items-center p-4 bg-gray-50 hover:bg-blue-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-all"
                    >
                      <Avatar user={user} size={40} />
                      <div className="ml-3 flex-1 text-left">
                        <p className="font-medium text-gray-800">{formatAuthorName(user.email || user.name)}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <div className="w-6 h-6 border-2 border-gray-300 rounded-full flex items-center justify-center">
                        <MdAdd size={16} className="text-blue-500" />
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <MdPeople size={40} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-600 font-medium">All users are already assigned</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messenger Chat Area */}
    <div className="flex-1 overflow-y-auto bg-contain bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto space-y-1">
        {/* Date Separator */}
        <div className="flex justify-center my-6">
          <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
            {(() => {
              if (!selectedProject?.comments || selectedProject.comments.length === 0) {
                return "Today";
              }
              
              // Get the earliest comment date
              const oldestComment = selectedProject.comments.reduce((oldest, current) => {
                const oldestDate = new Date(oldest.created_at);
                const currentDate = new Date(current.created_at);
                return currentDate < oldestDate ? current : oldest;
              });
              
              const commentDate = new Date(oldestComment.created_at);
              const today = new Date();
              
              // Reset times to compare dates only
              today.setHours(0, 0, 0, 0);
              commentDate.setHours(0, 0, 0, 0);
              
              const diffTime = today - commentDate;
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
              
              if (diffDays === 0) {
                return "Today";
              } else if (diffDays === 1) {
                return "Yesterday";
              } else if (diffDays < 7) {
                return `${diffDays} days ago`;
              } else if (diffDays < 30) {
                const weeks = Math.floor(diffDays / 7);
                return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
              } else if (diffDays < 365) {
                const months = Math.floor(diffDays / 30);
                return `${months} month${months !== 1 ? 's' : ''} ago`;
              } else {
                const years = Math.floor(diffDays / 365);
                return `${years} year${years !== 1 ? 's' : ''} ago`;
              }
            })()}
          </div>
        </div>
        
        {selectedProject && selectedProject.comments && selectedProject.comments.length > 0 ? (
          <>
            {/* Previous comments indicator */}
            <div className="text-center my-4">
              <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                ↑ View previous comments
              </button>
            </div>

            {/* Comments */}
            {selectedProject.comments.map(comment => {
              const isCurrentUser = comment.email === currentUser?.email;
              const commentUser = isCurrentUser ? currentUser : users.find(u => u.email === comment.email);
              
              return (
                <div key={comment.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-1`}>
                  <div className={`flex max-w-[80%] ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                    {!isCurrentUser && (
                      <div className="flex-shrink-0 mr-2 self-end">
                        <Avatar 
                          user={{
                            ...commentUser,
                            profile_image: comment.profile_image || commentUser?.profile_image
                          }} 
                          size={28} 
                        />
                      </div>
                    )}
                    
                    <div className={`flex flex-col ${isCurrentUser ? 'items-end' : ''}`}>
                      {!isCurrentUser && (
                        <span className="text-xs text-gray-600 font-medium mb-1 ml-1">
                          {comment.user || "User"}
                        </span>
                      )}
                      
                      <div className={`relative rounded-2xl px-4 py-2 max-w-[280px] ${
                        isCurrentUser 
                          ? 'bg-blue-500 text-white rounded-br-sm' 
                          : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
                      }`}>
                        {/* Messenger-style tail */}
                        {!isCurrentUser ? (
                          <div className="absolute -left-1.5 bottom-0 w-3 h-3 overflow-hidden">
                            <div className="absolute w-3 h-3 bg-white transform rotate-45 translate-y-1/2"></div>
                          </div>
                        ) : (
                          <div className="absolute -right-1.5 bottom-0 w-3 h-3 overflow-hidden">
                            <div className="absolute w-3 h-3 bg-blue-500 transform rotate-45 translate-y-1/2"></div>
                          </div>
                        )}
                        
                        {comment.text && (
                          <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                            {comment.text}
                          </p>
                        )}
                        
                        {comment.attachments && comment.attachments.length > 0 && (
                          <div className={`space-y-2 mt-2 ${comment.text ? 'pt-2 border-t border-opacity-20' : ''} ${
                            isCurrentUser ? 'border-white/30' : 'border-gray-200'
                          }`}>
                            {comment.attachments.map((att, idx) => {
                              const isImage = att.type && (att.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(att.name));
                              
                              return isImage ? (
                                <div key={idx} className="rounded-lg overflow-hidden border border-opacity-20">
                                  <img
                                    src={att.path}
                                    alt={att.name}
                                    className="w-full h-auto max-h-64 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                    onClick={() => window.open(att.path, '_blank')}
                                  />
                                  {comment.text && (
                                    <a
                                      href={att.path}
                                      download={att.name}
                                      className={`block text-xs mt-1 px-2 py-1 ${
                                        isCurrentUser 
                                          ? 'text-blue-200 hover:text-white' 
                                          : 'text-gray-500 hover:text-gray-700'
                                      }`}
                                    >
                                      📎 {att.name}
                                    </a>
                                  )}
                                </div>
                              ) : (
                                <a
                                  key={idx}
                                  href={att.path || att.data}
                                  download={att.name}
                                  className={`flex items-center text-sm px-3 py-2 rounded-lg transition-colors ${
                                    isCurrentUser 
                                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                  }`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <FiPaperclip size={16} className="mr-2 flex-shrink-0" />
                                  <span className="truncate flex-1">{att.name}</span>
                                  <span className="text-xs opacity-75 ml-2">
                                    {(att.size / 1024).toFixed(1)}KB
                                  </span>
                                </a>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      
                      <div className={`flex items-center mt-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-[10px] text-gray-400 mr-2">
                          {comment.time}
                        </span>
                        {isCurrentUser && (
                          <div className="text-blue-500">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          // Empty state with Messenger-style design
          <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12h-8v-2h8v2zm0-4h-8V8h8v2z"/>
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-600">No comments yet</p>
            <p className="text-sm text-gray-400 mt-1">Be the first to comment</p>
            <div className="mt-6 text-xs text-gray-400 flex items-center">
              <div className="w-1 h-1 bg-gray-300 rounded-full mx-2"></div>
              Messages are end-to-end encrypted
              <div className="w-1 h-1 bg-gray-300 rounded-full mx-2"></div>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Messenger Input Area */}
    <div className="bg-white border-t border-gray-200 px-4 py-3">
      {/* Typing indicator */}
      {false && ( // You can conditionally show this
        <div className="flex items-center mb-2 ml-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <span className="text-xs text-gray-500 ml-2">Someone is typing...</span>
        </div>
      )}
      
      {/* Attachments Preview */}
      {commentAttachments.length > 0 && (
        <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-blue-700">
              {commentAttachments.length} attachment{commentAttachments.length !== 1 ? 's' : ''}
            </div>
            <button
              onClick={() => setCommentAttachments([])}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
            {commentAttachments.map((att, idx) => (
              <div key={idx} className="relative group">
                <div className="flex items-center gap-2 bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="truncate max-w-[120px] text-gray-700">{att.name}</span>
                  <button
                    onClick={() => removeAttachment(idx)}
                    className="text-gray-400 hover:text-red-500 flex-shrink-0 ml-1"
                    title="Remove"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
{/* Input Form - Mobile Optimized */}
<div className="flex items-center gap-1">
  {/* Left side buttons */}
  <div className="flex items-center flex-shrink-0">
    <button 
      type="button"
      onClick={() => commentFileInputRef.current?.click()}
      className="p-2 text-gray-500 hover:text-blue-600 active:bg-gray-100 rounded-full transition-colors touch-manipulation"
      title="Attach files"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
      </svg>
    </button>
    
    <button 
      type="button"
      onClick={startCamera}
      className="p-2 text-gray-500 hover:text-green-600 active:bg-gray-100 rounded-full transition-colors touch-manipulation ml-0.5"
      title="Take photo"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
    </button>
  </div>
  
     {/* Oval input */}
  <div className="flex items-center flex-1 bg-gray-100 rounded-full px-3 py-2 shadow-sm">

    {/* Textarea */}
    <textarea
      value={commentText}
      onChange={(e) => setCommentText(e.target.value)}
      placeholder="Message"
      rows={1}
      name="msg"

      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="sentences"
      spellCheck={false}

      inputMode="text"
      enterKeyHint="send"

      className="flex-1 resize-none bg-transparent outline-none text-sm placeholder:text-gray-400 leading-5"

      style={{
        fontSize: "16px",
        WebkitAppearance: "none",
      }}

      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          if (commentText.trim() || commentAttachments.length > 0) {
            addComment(selectedProject.id);
          }
        }
      }}
    />
  </div>
   
   {/* Send button */}
   <button
     type="button"
     onClick={() => {
       if ((commentText.trim() || commentAttachments.length > 0) && !isSending) {
         addComment(selectedProject.id);
       }
     }}
     disabled={(!commentText.trim() && commentAttachments.length === 0) || isSending}
     className={`p-3 rounded-full transition-all ml-1 flex-shrink-0 touch-manipulation ${
       (commentText.trim() || commentAttachments.length > 0) && !isSending
         ? 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white shadow'
         : 'bg-gray-200 text-gray-400 cursor-not-allowed'
     }`}
     title="Send message"
     style={{ 
       minWidth: '44px',
       minHeight: '44px',
       WebkitTapHighlightColor: 'transparent',
     }}
   >
     {isSending ? (
       <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
       </svg>
     ) : (
       <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
         <path d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.8429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 L4.13399899,1.16151495 C3.34915502,0.9 2.40734225,0.9 1.77946707,1.4429026 C0.994623095,2.0766019 0.837654326,3.16592693 1.15159189,3.95141385 L3.03521743,10.3924068 C3.03521743,10.5495042 3.19218622,10.7066015 3.50612381,10.7066015 L16.6915026,11.4920884 C16.6915026,11.4920884 17.1624089,11.4920884 17.1624089,11.0051895 L17.1624089,12.4744748 C17.1624089,12.4744748 17.1624089,12.4744748 16.6915026,12.4744748 Z"/>
       </svg>
     )}
   </button>
 </div>
       
      
      <input
        ref={commentFileInputRef}
        type="file"
        multiple
        onChange={handleCommentFileChange}
        style={{ display: 'none' }}
      />
    </div>
    
  </div>
);

  const renderAnnouncementModal = () => (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-end z-50">
      <div className="bg-white rounded-t-3xl p-5 w-full max-h-[90%] overflow-auto">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-bold text-gray-800">Create New Announcement</h3>
          <button 
            onClick={() => setShowAnnouncementModal(false)}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
          >
            <IoMdClose size={24} className="text-gray-600" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={announcementTitle}
              onChange={(e) => setAnnouncementTitle(e.target.value)}
              placeholder="Enter announcement title"
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content *
            </label>
            <textarea
              value={announcementContent}
              onChange={(e) => setAnnouncementContent(e.target.value)}
              placeholder="Enter announcement content"
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={announcementType}
                onChange={(e) => setAnnouncementType(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
              >
                <option value="general">General</option>
                <option value="meeting">Meeting</option>
                <option value="deadline">Deadline</option>
                <option value="safety">Safety</option>
                <option value="update">Update</option>
                <option value="question">Question</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={announcementPriority}
                onChange={(e) => setAnnouncementPriority(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        </div>

        <button
          onClick={createAnnouncement}
          className={`w-full py-4 rounded-full font-bold text-white ${
            announcementTitle.trim() && announcementContent.trim()
              ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
          disabled={!announcementTitle.trim() || !announcementContent.trim()}
        >
          <div className="flex items-center justify-center">
            Publish Announcement
          </div>
        </button>
      </div>
    </div>
  );

  const renderProjectModal = () => (
    <div className="fixed inset-0 bg-white z-50 flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 md:px-5 py-3 md:py-4 flex items-center text-white shadow-lg">
        <button 
          onClick={() => setShowProjectModal(false)}
          className="p-2 rounded-full hover:bg-white/20 mr-3 transition-colors flex-shrink-0"
        >
          <FiChevronLeft size={24} />
        </button>
        <div className="flex-1">
          <h3 className="text-base md:text-lg font-bold">Create New Task</h3>
          <p className="text-xs opacity-90">Fill in the task details</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-5 bg-gray-50">
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task *
            </label>
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="Enter employee task"
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description/Locations *
            </label>
            <textarea
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="Enter project description"
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 bg-gray-50"
            />
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={projectStatus}
              onChange={(e) => setProjectStatus(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 bg-gray-50"
            >
              <option value="pending">Pending</option>
              <option value="ongoing">Ongoing</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employees
            </label>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {selectedUsers.length > 0 ? selectedUsers.map(userId => {
                const user = users.find(u => u.id === userId);
                if (!user) return null;

                const displayName = formatAuthorName(user.email || user.name);

                return (
                  <div key={userId} className="flex items-center bg-blue-50 rounded-full px-3 py-1 border">
                    <img 
                      src={user.profile_image} 
                      className="w-6 h-6 rounded-full mr-2" 
                      alt={displayName}
                    />
                    <span className="text-sm text-gray-700">{displayName}</span>
                  </div>
                );
              }) : (
                <p className="text-sm text-gray-500">No employees assigned</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={projectStartDate}
                  onChange={(e) => setProjectStartDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deadline *
                </label>
                <input
                  type="date"
                  value={projectDeadline}
                  onChange={(e) => setProjectDeadline(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 bg-gray-50"
                />
              </div>
          </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manager *
                </label>
                <input
                  type="text"
                  value={projectManager}
                  onChange={(e) => setProjectManager(e.target.value)}
                  placeholder="Project manager"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 bg-gray-50"
                />
              </div>
            

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 font-medium">₱</span>
                  <input
                    type="text"
                    value={projectBudget}
                    onChange={handleBudgetChange}
                    placeholder="50,000"
                    className="w-full p-3 pl-8 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 bg-gray-50"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign Users *
            </label>
            <select
              multiple
              ref={(select) => {
                if (select) {
                  // Set selected options based on selectedUsers
                  Array.from(select.options).forEach(option => {
                    option.selected = selectedUsers.includes(option.value);
                  });
                }
              }}
              onChange={(e) => {
                const options = Array.from(e.target.selectedOptions, option => option.value);
                setSelectedUsers(options);
              }}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 bg-gray-50"
            >
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {formatAuthorName(user.email)} ({user.email})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple users</p>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <button
          onClick={() => {
            // Strict validation
            const errors = [];
            
            if (!projectTitle.trim()) {
              errors.push("Task name is required");
            }
            if (!projectDeadline.trim()) {
              errors.push("Deadline is required");
            }
            if (!projectManager.trim()) {
              errors.push("Manager is required");
            }
            if (!projectBudget.trim()) {
              errors.push("Budget is required");
            }
            if (selectedUsers.length === 0) {
              errors.push("At least one employee must be assigned");
            }

            if (errors.length > 0) {
              Swal.fire({
                title: "Missing Required Fields",
                html: errors.map(e => `<div>• ${e}</div>`).join(""),
                icon: "warning",
                confirmButtonColor: "#3085d6",
                confirmButtonText: "OK",
              });
              return;
            }

            // All fields are filled, proceed with creation
            createProject();
          }}
          className={`w-full py-4 rounded-xl font-bold text-white ${
            projectTitle.trim() && 
            projectDeadline.trim() && 
            projectManager.trim() && 
            projectBudget.trim() && 
            selectedUsers.length > 0
              ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 cursor-pointer"
              : "bg-gray-400 cursor-not-allowed opacity-60"
          }`}
          disabled={
            !projectTitle.trim() || 
            !projectDeadline.trim() || 
            !projectManager.trim() || 
            !projectBudget.trim() || 
            selectedUsers.length === 0
          }
        >
          <div className="flex items-center justify-center">
            <MdAddTask className="mr-2" />
            Create Project
          </div>
        </button>
      </div>
    </div>
  );

  const renderLocationHistory = (item) => (
    <div key={item.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm flex items-center">
      <div className="w-10 h-10 rounded-full bg-blue-50 flex justify-center items-center mr-3">
        <MdLocationOn size={24} className="text-blue-500" />
      </div>
      <div className="flex-1">
        <div className="font-medium mb-1">{item.location}</div>
        <div className="flex items-center text-xs text-gray-500">
          <span>{item.time}</span>
          <span className="ml-3">{item.date}</span>
        </div>
      </div>
    </div>
  );

  // Shimmer/Skeleton Loading Component
  const ShimmerCard = () => (
    <div className="bg-white rounded-2xl p-4 mb-3 shadow-lg animate-pulse">
      <div className="h-4 bg-gray-200 rounded mb-3 w-3/4"></div>
      <div className="h-3 bg-gray-200 rounded mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
    </div>
  );

  const ShimmerStatsCard = () => (
    <div className="bg-gradient-to-br from-gray-300 to-gray-200 text-white rounded-2xl p-4 shadow-lg animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 bg-gray-400 rounded w-12 mb-2"></div>
          <div className="h-3 bg-gray-400 rounded w-24"></div>
        </div>
        <div className="w-6 h-6 bg-gray-400 rounded-full"></div>
      </div>
    </div>
  );

  const ShimmerProjectCard = () => (
    <div className="bg-white rounded-2xl p-4 mb-4 shadow-lg animate-pulse">
      <div className="h-5 bg-gray-200 rounded mb-3 w-2/3"></div>
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
        <div className="h-6 bg-gray-300 rounded-full w-20"></div>
      </div>
      <div className="h-2 bg-gray-200 rounded-full mb-3"></div>
      <div className="flex items-center justify-between">
        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    const filteredProjects = selectedFilter === "all" ? projects : projects.filter(p => p.status === selectedFilter);
    
    switch (activeTab) {
      case "Home":
        return (
          <div className="p-5">
            {/* Stats Cards - Mobile Optimized */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-6">
              {isLoadingProjects || isLoadingAnnouncements ? (
                <>
                  <ShimmerStatsCard />
                  <ShimmerStatsCard />
                </>
              ) : (
                <>
                  {/* Active Projects Card */}
                  <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white rounded-2xl p-4 sm:p-5 shadow-lg hover:shadow-xl transition-all active:scale-95 touch-manipulation">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex-1">
                        <div className="text-3xl sm:text-4xl font-bold leading-none mb-1">{projects.length}</div>
                        <div className="text-xs sm:text-sm opacity-90 font-medium">Active Tasks</div>
                      </div>
                      <div className="p-3 bg-white/20 rounded-full">
                        <MdDashboard size={24} className="text-white" />
                      </div>
                    </div>
                    
                    {/* Progress Indicator */}
                    <div className="mt-3 pt-3 border-t border-white/20">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="opacity-80">Progress</span>
                        <span className="font-semibold">{Math.round(projects.filter(p => p.status === 'completed').length / Math.max(projects.length, 1) * 100)}%</span>
                      </div>
                      <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-white rounded-full transition-all duration-500"
                          style={{ width: `${Math.round(projects.filter(p => p.status === 'completed').length / Math.max(projects.length, 1) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Announcements Card */}
                 <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white rounded-2xl p-4 sm:p-5 shadow-lg hover:shadow-xl transition-all active:scale-95 touch-manipulation">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex-1">
                        <div className="text-3xl sm:text-4xl font-bold leading-none mb-1">{announcements.length}</div>
                        <div className="text-xs sm:text-sm opacity-90 font-medium">Announcements</div>
                      </div>
                      <div className="p-3 bg-white/20 rounded-full relative">
                        <IoMdMegaphone size={24} className="text-white" />
                        {unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-bold shadow-lg">
                            {unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Status Indicator */}
                    <div className="mt-3 pt-3 border-t border-white/20">
                      <div className="flex items-center justify-between text-xs">
                        <span className="opacity-80">Unread:</span>
                        <span className="font-semibold">{unreadCount} new</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Recent Announcements */}
            <div className="mb-8">
              {/* Search and Filter Bar */}
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search announcements..."
                    className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl border-2 border-gray-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                {/* Compact Date Filter Icon Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowDateFilterMenu(!showDateFilterMenu)}
                    className="h-[52px] w-[52px] flex items-center justify-center bg-white border-2 border-gray-100 rounded-2xl hover:border-blue-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm"
                  >
                    <MdCalendarToday size={22} className={`${dateFilter !== 'all' ? 'text-blue-500' : 'text-gray-400'}`} />
                  </button>
                  
                  {/* Backdrop Overlay */}
                  {showDateFilterMenu && (
                    <div 
                      className="fixed inset-0 bg-black/30 z-40"
                      onClick={() => setShowDateFilterMenu(false)}
                    ></div>
                  )}
                  
                  {/* Date Filter Dropdown Menu */}
                  {showDateFilterMenu && (
                    <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 animate-slide-up">
                      <button
                        onClick={() => {
                          setDateFilter("all");
                          setShowDateFilterMenu(false);
                          setShowDatePicker(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                          dateFilter === "all" 
                            ? "bg-blue-50 text-blue-600 border-l-4 border-blue-500" 
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <MdCalendarToday size={18} />
                        <span>All Time</span>
                        {dateFilter === "all" && <IoMdCheckmarkCircle size={18} className="ml-auto" />}
                      </button>
                      <button
                        onClick={() => {
                          setDateFilter("today");
                          setShowDateFilterMenu(false);
                          setShowDatePicker(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                          dateFilter === "today" 
                            ? "bg-blue-50 text-blue-600 border-l-4 border-blue-500" 
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <MdCalendarToday size={18} />
                        <span>Today</span>
                        {dateFilter === "today" && <IoMdCheckmarkCircle size={18} className="ml-auto" />}
                      </button>
                      <button
                        onClick={() => {
                          setDateFilter("week");
                          setShowDateFilterMenu(false);
                          setShowDatePicker(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                          dateFilter === "week" 
                            ? "bg-blue-50 text-blue-600 border-l-4 border-blue-500" 
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <MdCalendarToday size={18} />
                        <span>This Week</span>
                        {dateFilter === "week" && <IoMdCheckmarkCircle size={18} className="ml-auto" />}
                      </button>
                      <button
                        onClick={() => {
                          setDateFilter("month");
                          setShowDateFilterMenu(false);
                          setShowDatePicker(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                          dateFilter === "month" 
                            ? "bg-blue-50 text-blue-600 border-l-4 border-blue-500" 
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <MdCalendarToday size={18} />
                        <span>This Month</span>
                        {dateFilter === "month" && <IoMdCheckmarkCircle size={18} className="ml-auto" />}
                      </button>
                      
                      <div className="border-t border-gray-200"></div>
                      
                      {/* Select Date Button - Opens Modal */}
                      <button
                        onClick={() => {
                          setShowDatePicker(true);
                          setShowDateFilterMenu(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                          dateFilter === "custom" 
                            ? "bg-blue-50 text-blue-600 border-l-4 border-blue-500" 
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <MdCalendarToday size={18} />
                        <span>Select Date</span>
                        {dateFilter === "custom" && <IoMdCheckmarkCircle size={18} className="ml-auto" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Current Date Display and Active Date Filter Label */}
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                {/* Current Date */}
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg border border-gray-300">
                  <MdCalendarToday size={16} className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Today: {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
                
                {/* Active Date Filter Label */}
                {dateFilter !== "all" && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                    <MdCalendarToday size={16} className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">
                      Filter: {
                        dateFilter === "today" ? "Today" :
                        dateFilter === "week" ? "This Week" :
                        dateFilter === "month" ? "This Month" :
                        dateFilter === "custom" && customDateRange.start && customDateRange.end 
                          ? `${new Date(customDateRange.start).toLocaleDateString()} - ${new Date(customDateRange.end).toLocaleDateString()}`
                          : "All Time"
                      }
                    </span>
                    <button
                      onClick={() => { 
                        setDateFilter("all");
                        setCustomDateRange({ start: null, end: null });
                      }}
                      className="ml-2 text-blue-600 hover:text-blue-800 font-semibold text-lg leading-none"
                      title="Clear date filter"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
              
              {/* Header with Action Button */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Announcements</h3>
                {/* Announcement Status Filter Dropdown */}
                <div className="relative">
                    <button
                      onClick={() => setShowAnnouncementFilterMenu(!showAnnouncementFilterMenu)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all font-medium text-sm ${
                        selectedFilter === "unread" ? "bg-orange-50 border-orange-300 text-orange-700" :
                        selectedFilter === "important" ? "bg-red-50 border-red-300 text-red-700" :
                        selectedFilter === "pinned" ? "bg-purple-50 border-purple-300 text-purple-700" :
                        "bg-blue-50 border-blue-300 text-blue-700"
                      }`}
                    >
                     {selectedFilter === "unread" ? <FaRegBell size={18} /> :
                       selectedFilter === "important" ? <MdPriorityHigh size={18} /> :
                       selectedFilter === "pinned" ? <MdPushPin size={18} /> :
                       <MdCheckCircle size={18} />}
                      <span>
                        {selectedFilter === "unread" ? "Unread" :
                         selectedFilter === "important" ? "Important" :
                         selectedFilter === "pinned" ? "Pinned" :
                         "All"}
                      </span>
                       <FiChevronRight size={16} className={`transition-transform ${showAnnouncementFilterMenu ? 'rotate-90' : ''}`} />
                    </button>

                    {/* Backdrop Overlay */}
                    {showAnnouncementFilterMenu && (
                      <div 
                        className="fixed inset-0 bg-black/30 z-40"
                        onClick={() => setShowAnnouncementFilterMenu(false)}
                      ></div>
                    )}

                    {/* Dropdown Menu */}
                    {showAnnouncementFilterMenu && (
                      <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden animate-slide-up">
                        <button
                          onClick={() => {
                            setSelectedFilter("unread");
                            setShowAnnouncementFilterMenu(false);
                          }}
                           className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                            selectedFilter === "unread"
                              ? "bg-orange-50 text-orange-700 border-l-4 border-orange-500"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <FaRegBell size={18} />
                          <span>Unread</span>
                          {selectedFilter === "unread" && <IoMdCheckmarkCircle size={18} className="ml-auto text-orange-600" />}
                        </button>
                        
                        <button
                          onClick={() => {
                            setSelectedFilter("important");
                            setShowAnnouncementFilterMenu(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                            selectedFilter === "important"
                              ? "bg-red-50 text-red-700 border-l-4 border-red-500"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <MdPriorityHigh size={18} />
                          <span>Important</span>
                          {selectedFilter === "important" && <IoMdCheckmarkCircle size={18} className="ml-auto text-red-600" />}
                        </button>
                        
                        <button
                          onClick={() => {
                            setSelectedFilter("pinned");
                            setShowAnnouncementFilterMenu(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                            selectedFilter === "pinned"
                              ? "bg-purple-50 text-purple-700 border-l-4 border-purple-500"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <MdPushPin size={18} />
                          <span>Pinned</span>
                          {selectedFilter === "pinned" && <IoMdCheckmarkCircle size={18} className="ml-auto text-purple-600" />}
                        </button>
                        
                        <div className="border-t border-gray-200"></div>
                        
                        <button
                          onClick={() => {
                            setSelectedFilter("all");
                            setShowAnnouncementFilterMenu(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                            selectedFilter === "all"
                              ? "bg-blue-50 text-blue-700 border-l-4 border-blue-500"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <MdCheckCircle size={18} />
                          <span>All</span>
                          {selectedFilter === "all" && <IoMdCheckmarkCircle size={18} className="ml-auto text-blue-600" />}
                        </button>
                        
                        <div className="border-t border-gray-200"></div>
                        
                        <button
                          onClick={() => {
                            markAllAsRead();
                            setShowAnnouncementFilterMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors text-blue-600 hover:bg-blue-50"
                        >
                          <MdCheckCircle size={18} />
                          <span>Mark all as read</span>
                        </button>
                      </div>
                    )}
                </div>
              </div>
              
              {/* Date Picker Modal - Always shows at top */}
              {showDatePicker && (
                <div 
                  className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 pt-20 overflow-hidden" 
                  onClick={() => setShowDatePicker(false)}
                  style={{ touchAction: 'none' }}
                >
                  <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-gray-800">Select Date Range</h3>
                      <button onClick={() => setShowDatePicker(false)} className="p-1 hover:bg-gray-100 rounded-full">
                        <IoMdClose size={24} className="text-gray-600" />
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                        <input
                          type="date"
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                        <input
                          type="date"
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                        />
                      </div>
                      
                      <button
                        onClick={() => {
                          if (customDateRange.start && customDateRange.end) {
                            setDateFilter("custom");
                            setShowDateFilterMenu(false);
                            setShowDatePicker(false);
                          }
                        }}
                        disabled={!customDateRange.start || !customDateRange.end}
                        className={`w-full py-3 font-semibold rounded-xl transition-all ${
                          customDateRange.start && customDateRange.end
                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        Apply Filter
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {isLoadingAnnouncements ? (
          <>
            <ShimmerCard />
            <ShimmerCard />
            <ShimmerCard />
            <ShimmerCard />
          </>
              ) : (
          <>
            {filteredAnnouncements.length > 0 ? (
              <>
                {selectedFilter === "all" ? filteredAnnouncements.map(renderAnnouncementCard) : filteredAnnouncements.slice(0, 4).map(renderAnnouncementCard)}
                {filteredAnnouncements.length > 4 && selectedFilter !== "all" && (
                  <button 
                    className="w-full py-3 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50"
                    onClick={() => setSelectedFilter("all")}
                  >
                    View all announcements
                  </button>
                )}
              </>
            ) : (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiBell size={24} className="text-gray-400" />
                </div>
                <h3 className="text-gray-600 font-medium">No announcements found</h3>
                <p className="text-gray-400 text-sm mt-1">Try a different search or filter</p>
              </div>
            )}
          </>
              )}
            </div>
          </div>
        );

      case "Projects":
        const totalProjects = projects.length;
        const ongoingProjects = projects.filter(p => p.status === "ongoing").length;
        const completedProjects = projects.filter(p => p.status === "completed").length;
        const pendingProjects = projects.filter(p => p.status === "pending").length;
        
        return (
          <div className="p-5">
            {/* My Tasks Overview - Enhanced Stats Card */}
            {isLoadingProjects ? (
              <div className="bg-gradient-to-br from-gray-300 to-gray-200 rounded-2xl p-5 mb-6 shadow-lg animate-pulse h-40"></div>
            ) : (
              <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white rounded-3xl p-6 mb-6 shadow-xl relative overflow-hidden">
                {/* Background pattern */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>
                
                <div className="relative z-10">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <MdDashboard size={24} />
                    My Tasks Overview
                  </h3>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/20 hover:bg-white/20 transition-all">
                      <div className="text-3xl font-bold leading-none mb-1">{totalProjects}</div>
                      <div className="text-xs opacity-90 font-medium">Total</div>
                    </div>
                    <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/20 hover:bg-white/20 transition-all">
                      <div className="text-3xl font-bold leading-none mb-1">{ongoingProjects}</div>
                      <div className="text-xs opacity-90 font-medium">Ongoing</div>
                    </div>
                    <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/20 hover:bg-white/20 transition-all">
                      <div className="text-3xl font-bold leading-none mb-1">{completedProjects}</div>
                      <div className="text-xs opacity-90 font-medium">Done</div>
                    </div>
                    <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/20 hover:bg-white/20 transition-all">
                      <div className="text-3xl font-bold leading-none mb-1">{pendingProjects}</div>
                      <div className="text-xs opacity-90 font-medium">Pending</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Filter Buttons */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {["all", "pending", "ongoing", "scheduled", "completed"].map(status => (
                <button
                  key={status}
                  onClick={() => setSelectedFilter(status)}
                  className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                    selectedFilter === status
                      ? "bg-blue-500 text-white shadow-lg"
                      : "bg-white text-gray-700 border border-gray-300 hover:border-blue-500"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            {/* Projects List */}
            <div className="mb-6">
              {isLoadingProjects ? (
                <>
                  <ShimmerProjectCard />
                  <ShimmerProjectCard />
                  <ShimmerProjectCard />
                  <ShimmerProjectCard />
                </>
              ) : filteredProjects.length > 0 ? (
                filteredProjects.map(renderProjectCard)
              ) : (
                <div className="text-center py-10">
                  <MdDashboard size={40} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-600 font-medium">No {selectedFilter !== "all" ? selectedFilter : ""} projects found</p>
                  <p className="text-sm text-gray-400 mt-1">Create a new task to get started</p>
                </div>
              )}
            </div>
          </div>
        );

      case "My Location":
        return (
          <div className="relative h-full w-full">
            {/* Location Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-5 sticky top-0 z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <button
                    className="bg-white/20 hover:bg-white/30 p-3 rounded-full transition-colors mr-3"
                    onClick={() => handleTabChange("Home")}
                    aria-label="Back"
                    title="Back"
                  >
                    <FiChevronLeft size={24} />
                  </button>
                  <div>
                    <h2 className="text-2xl font-bold">My Location</h2>
                    <p className="text-blue-100 text-sm mt-1">Track and manage your location</p>
                  </div>
                </div>
                <button
                  className="bg-white/20 hover:bg-white/30 p-3 rounded-full transition-colors"
                  onClick={() => setShowLocationModal(true)}
                >
                  <MdLocationOn size={24} />
                </button>
              </div>

              {/* Current Location Card */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="text-sm text-blue-100 mb-1">Current Location</div>
                <div className="text-2xl font-bold">{currentLocation}</div>
              </div>
            </div>

            {/* Location History */}
            <div className="p-5">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Locations</h3>
              <div>
                {locationHistory.length > 0 ? (
                  locationHistory.map(renderLocationHistory)
                ) : (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MdLocationOn size={24} className="text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium">No location history yet</p>
                    <p className="text-gray-400 text-sm mt-1">Update your location to start tracking</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "Profile":
        return !isMobile ? (
          <div className="p-5">
            <div className="bg-white rounded-2xl p-5 shadow-lg">
              <h3 className="text-xl font-bold mb-5">Admin Profile</h3>
              <p className="text-gray-600 mb-4">
                Manage your admin account settings and preferences.
              </p>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                onClick={() => alert("Edit profile")}
              >
                Edit Profile
              </button>
            </div>
          </div>
        ) : null;

      default:
        return null;
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = async () => {
        const imageData = reader.result;
        setSelectedFile(imageData);
        try {
          const response = await fetch('/backend/profile.php', {
            method: 'POST',
            credentials: 'include',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({profile_image: imageData})
          });
          const data = await response.json();
          console.log('Profile update response:', data);
          if (data.status === 'success') {
            // Update user object in localStorage with new profile image
            const updatedUser = { ...currentUser, profile_image: imageData };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setCurrentUser(updatedUser);
            
            // Refresh the users list to get updated profile images
            fetch("/backend/users.php", {
              credentials: "include",
            })
              .then(res => handleApiResponse(res))
              .then(data => setUsers(data))
              .catch(err => console.error("Users refresh error:", err));
            
            alert('Profile image updated successfully');
          } else {
            console.error('Profile update error:', data.message);
            alert('Failed to update profile image: ' + (data.message || 'Unknown error'));
          }
        } catch (error) {
          console.error('Error updating profile:', error);
          alert('Error updating profile image: ' + error.message);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const renderProfile = () => (
  <div className="h-full flex flex-col">
    {/* Profile Header */}
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4 flex justify-between items-center text-white">
      <div className="flex items-center">
        <div className="w-10 h-10 rounded-full border-2 border-white mr-3 overflow-hidden">
          <Avatar
            user={{
              ...currentUser,
              uploaded_profile_image: selectedFile || currentUser?.uploaded_profile_image,
              profile_image: selectedFile || currentUser?.uploaded_profile_image || currentUser?.profile_image,
            }}
            size={40}
          />
        </div>
        <div>
          <div className="text-xl font-bold">Admin Profile</div>
          <div className="flex items-center mt-1 text-xs">
            <div className="w-2 h-2 rounded-full bg-green-400 mr-2"></div>
            Status: {userStatus}
          </div>
        </div>
      </div>
      <button 
        onClick={() => setProfileOpen(false)}
        className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
      >
        <IoMdClose size={24} />
      </button>
    </div>

    {/* Profile Content */}
    <div className="flex-1 overflow-auto p-5 bg-gray-50">
      {/* User Info Card */}
      <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
              <div className="w-28 h-28 rounded-full border-4 border-blue-100 overflow-hidden">
                <Avatar
                  user={{
                    ...currentUser,
                    uploaded_profile_image: selectedFile || currentUser?.uploaded_profile_image,
                    profile_image: selectedFile || currentUser?.uploaded_profile_image || currentUser?.profile_image,
                  }}
                  size={112}
                />
              </div>
              <button 
                className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full border-4 border-white hover:bg-blue-600"
                onClick={() => fileInputRef.current.click()}
              >
                <FiCamera size={16} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                style={{display: 'none'}} 
              />
            </div>
          <h3 className="text-xl font-bold mb-1"> {currentUser?.email ? currentUser.email.split("@")[0].replace(/\b\w/g, c => c.toUpperCase()) : "N/A"}</h3> 
          <p className="text-gray-500 mb-2">HR Department</p>
          <p className="text-sm text-gray-600 mb-1">{currentUser?.email || "admin@company.com"}</p>
          <p className="text-sm text-gray-600">{currentUser?.phone || "+1 (555) 123-4567"}</p>
        </div>

        {/* Admin Info */}
        <div className="border-t pt-4">
          <h4 className="font-bold text-gray-700 mb-2">Administrator Information</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-500">Admin ID</p>
              <p className="font-medium">ADM-001</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Department</p>
              <p className="font-medium">Management</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Join Date</p>
              <p className="font-medium">2023-01-15</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Access Level</p>
              <p className="font-medium text-green-600">Full Access</p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="space-y-3 mb-6">
        <h4 className="font-bold text-gray-700 mb-2 px-2">Admin Controls</h4>
        
        <button className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center hover:bg-gray-50 transition-colors active:bg-gray-100">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
            <FiSettings size={22} className="text-blue-500" />
          </div>
          <div className="flex-1 text-left">
            <div className="font-medium">System Settings</div>
            <div className="text-xs text-gray-500">Configure system preferences</div>
          </div>
          <FiChevronRight size={20} className="text-gray-400" />
        </button>

        <button className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center hover:bg-gray-50 transition-colors active:bg-gray-100">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
            <MdPeople size={22} className="text-green-500" />
          </div>
          <div className="flex-1 text-left">
            <div className="font-medium">Manage Users</div>
            <div className="text-xs text-gray-500">Add/remove team members</div>
          </div>
          <FiChevronRight size={20} className="text-gray-400" />
        </button>

        <button className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center hover:bg-gray-50 transition-colors active:bg-gray-100">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mr-4">
            <MdDashboard size={22} className="text-purple-500" />
          </div>
          <div className="flex-1 text-left">
            <div className="font-medium">Project Management</div>
            <div className="text-xs text-gray-500">Manage all projects</div>
          </div>
          <FiChevronRight size={20} className="text-gray-400" />
        </button>

        <button className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center hover:bg-gray-50 transition-colors active:bg-gray-100">
          <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mr-4">
            <MdReportProblem size={22} className="text-yellow-500" />
          </div>
          <div className="flex-1 text-left">
            <div className="font-medium">Reports & Analytics</div>
            <div className="text-xs text-gray-500">View system reports</div>
          </div>
          <FiChevronRight size={20} className="text-gray-400" />
        </button>

        <button className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center hover:bg-gray-50 transition-colors active:bg-gray-100">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
            <IoMdNotifications size={22} className="text-red-500" />
          </div>
          <div className="flex-1 text-left">
            <div className="font-medium">Notification Settings</div>
            <div className="text-xs text-gray-500">Configure alerts</div>
          </div>
          <FiChevronRight size={20} className="text-gray-400" />
        </button>
      </div>

      {/* Additional Settings */}
      <div className="bg-white rounded-xl p-4 mb-6">
        <h4 className="font-bold text-gray-700 mb-3">System Preferences</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span>Email Notifications</span>
            <div className="w-12 h-6 bg-blue-500 rounded-full relative">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span>Auto Backup</span>
            <div className="w-12 h-6 bg-green-500 rounded-full relative">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span>Audit Log</span>
            <div className="w-12 h-6 bg-blue-500 rounded-full relative">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <button
        className="w-full py-4 bg-red-500 text-white rounded-xl font-medium flex items-center justify-center hover:bg-red-600 transition-colors active:bg-red-700 mb-4"
        onClick={() => {
          logout();
          setProfileOpen(false);
        }}
      >
        <FaSignOutAlt size={20} className="mr-2" />
        Logout Admin Account
      </button>

      {/* App Version */}
      <div className="text-center text-gray-400 text-sm py-3 border-t">
        <p>Construction Manager Admin v3.0.1</p>
        <p className="text-xs mt-1">Last updated: Today, 14:30 PM</p>
      </div>
    </div>
  </div>
);

  const ActionMenu = () => (
    <div className="fixed inset-0 z-30 flex items-end">
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={() => setShowActionMenu(false)}
      />
      <div 
        ref={actionMenuRef}
        className="relative bg-white rounded-t-3xl p-5 w-full max-h-[50%] overflow-auto animate-slide-up z-40"
      >
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4"></div>
        <h3 className="text-xl font-bold mb-5 text-center">Admin Actions</h3>
        
        <button
          className="w-full flex items-center p-4 border-b border-gray-100 hover:bg-blue-50 active:bg-blue-100"
          onClick={() => {
            setShowAnnouncementModal(true);
            setShowActionMenu(false);
          }}
        >
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
            <IoMdMegaphone size={20} className="text-blue-500" />
          </div>
          <div className="text-left">
            <div className="font-medium">Create Announcement</div>
            <div className="text-xs text-gray-500">Post updates to employees</div>
          </div>
        </button>

        <button
          className="w-full flex items-center p-4 hover:bg-purple-50 active:bg-purple-100"
          onClick={() => {
            setShowProjectModal(true);
            setShowActionMenu(false); 
          }}
        >
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
            <MdDashboard size={20} className="text-purple-500" />
          </div>
          <div className="text-left">
            <div className="font-medium">Add New Task</div>
            <div className="text-xs text-gray-500">Create new Task</div>
          </div>
        </button>
      </div>
    </div>
  );

  const unreadCount = announcements.filter(a => a.unread).length;

  return (
    <div className="min-h-screen pb-20 bg-gray-100 relative">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-md flex items-center justify-center z-50">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-800 text-2xl font-bold">Loading...</p>
          </div>
        </div>
      )}
      {/* Main Header */}
      {activeTab !== "My Location" && (
        <div className="sticky top-0 z-20 bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4 flex justify-between items-center text-white shadow-lg">
          <div className="flex items-center">
            {isMobile && activeTab !== "Profile" && (
               <button 
            onClick={() => setProfileOpen(true)}
                className="mr-3 p-1 rounded-full bg-white/90 hover:bg-white transition-colors shadow"
                >
                <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center">
                    <img
                    src="/img/stelsenlogo.png"
                    alt="Menu"
                    className="w-8 h-8 object-contain"
                    />
                </div>
            </button>
            )}
            <div>
              <div className="text-xl font-bold">
               <h3 className="text-xl font-bold mb-1"> {currentUser?.email ? currentUser.email.split("@")[0].replace(/\b\w/g, c => c.toUpperCase()) : "N/A"}</h3> 
              </div>
              <div className="flex items-center mt-1 text-xs">
                <div className="w-2 h-2 rounded-full bg-green-400 mr-2"></div>
                Statusssss: {userStatus}
              </div>
            </div>
          </div>
          <div className="relative">
            <div
              className="w-10 h-10 rounded-full border-2 border-white cursor-pointer shadow overflow-hidden"
              onClick={handleProfileClick}
            >
              <Avatar
                user={{
                  ...currentUser,
                  uploaded_profile_image: selectedFile || currentUser?.uploaded_profile_image,
                  profile_image: selectedFile || currentUser?.uploaded_profile_image || currentUser?.profile_image,
                }}
                size={40}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`transition-all duration-300 ${profileOpen && isMobile ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        <div className="overflow-auto">
          {renderTabContent()}
        </div>
      </div>

      {/* Bottom Navbar */}
      {activeTab !== "My Location" && (
        <div className={`fixed bottom-0 left-0 w-full bg-white border-t border-gray-300 flex items-center justify-around py-2 z-10 transition-all duration-300 ${profileOpen ? 'opacity-0 translate-y-10' : 'opacity-100 translate-y-0'}`}>
          <button
            className={`flex flex-col items-center relative ${activeTab === "Home" ? "text-blue-500" : "text-gray-500"}`}
            onClick={() => handleTabChange("Home")}
          >
            <IoMdHome size={24} />
            <span className="text-xs mt-1">Home</span>
          </button>

          <button
            className={`flex flex-col items-center relative ${activeTab === "Projects" ? "text-blue-500" : "text-gray-500"}`}
            onClick={() => handleTabChange("Projects")}
          >
            <MdDashboard size={24} />
            <span className="text-xs mt-1">Projects</span>
          </button>

          <div className="relative -top-6">
            <button
              onClick={() => setShowActionMenu(true)}
              className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl active:scale-95 transition-all"
            >
              <MdAdd size={32} />
            </button>
          </div>

          <button
            className={`flex flex-col items-center relative ${activeTab === "My Location" ? "text-blue-500" : "text-gray-500"}`}
            onClick={() => handleTabChange("My Location")}
          >
            <MdLocationOn size={24} />
            <span className="text-xs mt-1">Location</span>
          </button>

          <button
            className={`flex flex-col items-center relative ${activeTab === "Profile" ? "text-blue-500" : "text-gray-500"}`}
            onClick={handleProfileClick}
          >
            <FaUser size={24} />
            <span className="text-xs mt-1">Profile</span>
          </button>
        </div>
      )}

      {/* Action Menu Modal */}
      {showActionMenu && <ActionMenu />}

      {/* Profile Sidebar */}
      {profileOpen && isMobile && (
        <div className="fixed top-0 left-0 w-full h-full bg-white z-30 flex flex-col">
          {renderProfile()}
        </div>
      )}

      {/* Announcement Creation Modal */}
      {showAnnouncementModal && renderAnnouncementModal()}

      {/* Project Creation Modal */}
      {showProjectModal && renderProjectModal()}

      {/* Project Details - Stack Navigation */}
      {getCurrentScreen()?.screen === "projectDetails" && renderProjectDetailsModal()}

      {/* Comments Modal - Stack Navigation */}
      {showCommentsModal && renderCommentsModal()}

      {/* Location Update Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-end z-40">
          <div className="bg-white rounded-t-3xl p-5 w-full max-h-[80%] overflow-auto">
            <div className="flex justify-between items-center mb-5">
              <span className="text-xl font-bold">Update Location</span>
              <button onClick={() => setShowLocationModal(false)}>
                <IoMdClose size={24} />
              </button>
            </div>
            {["Office", "Site A", "Site B", "Client Meeting", "On The Way", "Break"].map(location => (
              <button
                key={location}
                className="flex justify-between items-center w-full py-4 border-b border-gray-100 hover:bg-gray-50"
                onClick={() => updateLocation(location)}
              >
                <MdLocationOn size={20} className="text-blue-500" />
                <span>{location}</span>
                <FiChevronRight size={20} className="text-gray-500" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Take Photo</h3>
              <button onClick={stopCamera} className="text-gray-500 hover:text-gray-700">
                <IoMdClose size={24} />
              </button>
            </div>
            
            <div className="relative bg-black">
              <video 
                ref={videoRef}
                autoPlay 
                playsInline
                className="w-full h-auto max-h-[60vh] object-contain"
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>

            <div className="p-4 flex justify-center gap-4">
              <button
                onClick={stopCamera}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={capturePhoto}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
              >
                <FiCamera size={20} />
                Capture
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
