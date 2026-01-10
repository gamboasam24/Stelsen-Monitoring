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
  MdAssignment,
  MdEdit,
  MdDelete,
  MdPriorityHigh,
  MdPeople,
  MdChatBubble
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
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

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
  const [showProjectDetailsModal, setShowProjectDetailsModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [currentLocation, setCurrentLocation] = useState("Office");
  const [reportMessage, setReportMessage] = useState("");
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [announcementType, setAnnouncementType] = useState("general");
  const [announcementPriority, setAnnouncementPriority] = useState("medium");
  const [commentText, setCommentText] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [userStatus, setUserStatus] = useState("Active");
  const [profileOpen, setProfileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const actionMenuRef = useRef(null);
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);

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
  
// Format author name from email
const formatAuthorName = (email) => {
  if (!email) return "Unknown";

  return email
    .split("@")[0]            // remove domain
    .replace(/\d+/g, "")      // remove numbers
    .replace(/\b\w/g, c => c.toUpperCase()); // capitalize
};

  // Enhanced announcements data
  useEffect(() => {
    fetch("/backend/announcements.php", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        const normalized = data.map(a => ({
          id: a.announcement_id,
          title: a.title,
          content: a.content,
          type: a.type,
          priority: a.priority,
          author: formatAuthorName(a.author),
          time: formatTimeAgo(a.created_at),
          unread: a.unread === 1,
          category: a.type.charAt(0).toUpperCase() + a.type.slice(1),
          important: a.priority === "high",
          color: getColorForType(a.type),
          icon: getIconForType(a.type),
        }));

        setAnnouncements(normalized);
      });
  }, []);

  // Enhanced projects data with comments
  const [projects, setProjects] = useState([]);
  const [announcements, setAnnouncements] = useState([]); // <-- add this
  const [users, setUsers] = useState([]);

  // Fetch users
  useEffect(() => {
    fetch("/backend/users.php", {
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error("Users error:", err));
  }, []);

  //================================================== Filtered announcements ==================================================
  const filteredAnnouncements = announcements.filter(ann => {
    if (selectedFilter === "unread") return ann.unread;
    if (selectedFilter === "important") return ann.important;
    if (selectedFilter === "read") return !ann.unread;
    return true;
  }).filter(ann => 
    ann.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ann.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    .then(res => res.json())
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
        .then(res => res.json())
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
  
 const Avatar = ({ user, size = 32 }) => {
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
        className="bg-blue-500 text-white font-bold flex items-center justify-center rounded-full"
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
      className="rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  );
};

  //============================================== Get icon for announcement type =================================================
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

  //================================================== Get color for announcement type =================================================
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

  //================================================== Mark announcement as read =================================================
const markAsRead = async (id) => {
  await fetch("/backend/announcements_read.php", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });

  setAnnouncements(prev =>
    prev.map(a => a.id === id ? { ...a, unread: false } : a)
  );
};

  //======================================================= Mark all as read =================================================
  const markAllAsRead = () => {
    setAnnouncements(prev => 
      prev.map(ann => ({ ...ann, unread: false }))
    );
  };

  // Delete announcement
  const deleteAnnouncement = (id) => {
    if (window.confirm("Are you sure you want to delete this announcement?")) {
      setAnnouncements(prev => prev.filter(ann => ann.id !== id));
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
  return created.toLocaleDateString();
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
  fetch("/backend/projects.php", {
    credentials: "include",
  })
    .then(res => res.json())
    .then(data => setProjects(data))
    .catch(err => console.error("Projects error:", err));
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
      case "pending": return "bg-red-500";
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
      setActiveTab("Profile");
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (profileOpen) setProfileOpen(false);
    if (showActionMenu) setShowActionMenu(false);
  };

  const viewProjectDetails = (project) => {
    setSelectedProject(project);
    setShowProjectDetailsModal(true);
  };

  //========================================================== Add Comment ==========================================================
  const addComment = async (projectId) => {
    if (!commentText.trim()) return;

    const newComment = {
      project_id: projectId,
      text: commentText,
    };

    try {
      const response = await fetch("/backend/comments.php", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newComment),
      });

      const data = await response.json();
      if (data.status === "success") {
        // Create new comment with profile image
        const newCommentObj = {
          id: data.comment_id || Date.now(),
          user: data.user || "Admin",
          text: commentText,
          time: "Just now",
          profile_image: data.profile_image || currentUser?.profile_image,
          email: data.email || currentUser?.email
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
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to add comment. Please try again.");
    }
  };

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
            onClick={() => deleteAnnouncement(announcement.id)}
            className="text-gray-400 hover:text-red-500"
          >
            <MdDelete size={18} />
          </button>
        </div>
      </div>
      
      {/* Content */}
      <p className="text-gray-600 text-sm mb-4">{announcement.content}</p>
      
      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-4">
          <span className="text-xs text-gray-500 flex items-center">
            <IoMdTime className="mr-1" size={14} />
            {announcement.time}
          </span>
          <span className="text-xs text-gray-500">By: {announcement.author}</span>
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
            <div className="flex items-center text-green-500 text-sm">
              <IoMdCheckmarkCircle size={16} className="mr-1" />
              <span>Read</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderProjectCard = (item) => (
    <div key={item.id} className="bg-white rounded-2xl p-4 mb-3 shadow-lg hover:shadow-xl transition-all">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center flex-1">
          <MdDashboard size={20} className="text-blue-500" />
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
          <span>Progress</span>
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
          <div>Team Users: <span className="font-medium">{item.team_users || 0} users</span></div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="flex items-center text-xs text-gray-500">
            <MdComment size={14} className="mr-1" />
            {item.comments.length}
          </span>
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

  const renderProjectDetailsModal = () => (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-end z-50">
      <div className="bg-white rounded-t-3xl p-5 w-full max-h-[90%] overflow-auto">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-bold text-gray-800">Tasks Details</h3>
          <button 
            onClick={() => setShowProjectDetailsModal(false)}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
          >
            <IoMdClose size={24} className="text-gray-600" />
          </button>
        </div>
        
        {selectedProject && (
          <>
            {/* Title and Status */}
            <div className="flex flex-row items-start sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-gray-200">
              <h4 className="text-lg font-bold text-gray-800 flex-1">{selectedProject.title}</h4>
              <div className="flex-shrink-0">
                <span className={`px-3 py-1 rounded-full ${getStatusColor(selectedProject.status)} text-white text-xs inline-block`}>
                  {selectedProject.status}
                </span>
              </div>
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
                          <Avatar user={user} size={14} />
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
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-2 sm:p-4 border border-blue-200">
                  <p className="text-xs font-semibold text-gray-600 mb-1 sm:mb-2 uppercase tracking-wide">Manager</p>
                  <p className="font-semibold text-gray-800 text-xs sm:text-sm truncate">{selectedProject.manager}</p>
                </div>

                {/* Team Users */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-2 sm:p-4 border border-green-200">
                  <p className="text-xs font-semibold text-gray-600 mb-1 sm:mb-2 uppercase tracking-wide">Team Users</p>
                  <p className="font-semibold text-gray-800 text-xs sm:text-sm">{selectedProject.team_users || 0} users</p>
                </div>

                {/* Budget */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-2 sm:p-4 border border-purple-200">
                  <p className="text-xs font-semibold text-gray-600 mb-1 sm:mb-2 uppercase tracking-wide">Budget</p>
                  <p className="font-semibold text-gray-800 text-xs sm:text-sm truncate">{selectedProject.budget}</p>
                </div>

                {/* Deadline */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-2 sm:p-4 border border-orange-200">
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
                onClick={() => setShowCommentsModal(true)}
                className="w-full bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl p-4 transition-all border border-blue-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-blue-500 p-3 rounded-full mr-3">
                      <MdComment className="text-white" size={24} />
                    </div>
                    <div className="text-left">
                      <h4 className="text-lg font-bold text-gray-800">Comments & Clarifications</h4>
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
  );

  const renderCommentsModal = () => (
    <div className="fixed inset-0 bg-white z-[60] flex flex-col md:rounded-2xl md:w-[90%] md:h-[90%] md:left-[5%] md:top-[5%] md:bottom-auto md:mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 md:px-5 py-3 md:py-4 flex items-center text-white shadow-lg rounded-t-none md:rounded-t-2xl">
        <button 
          onClick={() => setShowCommentsModal(false)}
          className="p-2 rounded-full hover:bg-white/20 mr-3 transition-colors flex-shrink-0"
        >
          <FiChevronLeft size={24} />
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="text-base md:text-lg font-bold truncate">Comments & Clarifications</h3>
          <p className="text-xs opacity-90 truncate">{selectedProject?.title}</p>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 bg-gray-50">
        {selectedProject && selectedProject.comments.length > 0 ? (
          <div className="space-y-3">
            {selectedProject.comments.map(comment => {
              const isCurrentUser = comment.user === "Admin" || comment.email === currentUser?.email;
              const commentUser = comment.user === "Admin" ? currentUser : users.find(u => u.email === comment.email);
              
              return (
                <div key={comment.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-start gap-2 max-w-[80%] ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    <Avatar 
                      user={{
                        ...commentUser,
                        profile_image: comment.profile_image || commentUser?.profile_image
                      }} 
                      size={36} 
                    />
                    <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                      <div className={`${
                        isCurrentUser 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-white text-gray-800 border border-gray-200'
                      } rounded-2xl px-4 py-3 shadow-sm`}>
                        <p className="text-sm leading-relaxed">{comment.text}</p>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 px-2">{comment.time}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MdComment size={64} className="opacity-30 mb-3" />
            <p className="text-lg font-medium">No comments yet</p>
            <p className="text-sm">Start the conversation below</p>
          </div>
        )}
      </div>

      {/* Input Area - Fixed at Bottom */}
      <div className="bg-white border-t border-gray-200 p-3 md:p-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Avatar user={currentUser} size={32} className="flex-shrink-0" />
          <div className="flex-1 flex items-center bg-gray-100 rounded-full px-3 md:px-4 py-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && commentText.trim()) {
                  addComment(selectedProject.id);
                }
              }}
              placeholder="Type a message..."
              className="flex-1 bg-transparent outline-none text-sm"
            />
            <button className="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0">
              <FiCamera size={18} />
            </button>
          </div>
          <button
            onClick={() => {
              if (commentText.trim()) {
                addComment(selectedProject.id);
              }
            }}
            disabled={!commentText.trim()}
            className={`p-2 md:p-3 rounded-full transition-all flex-shrink-0 ${
              commentText.trim()
                ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <IoMdSend size={18} />
          </button>
        </div>
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
          className={`w-full py-4 rounded-xl font-bold text-white ${
            announcementTitle.trim() && announcementContent.trim()
              ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
          disabled={!announcementTitle.trim() || !announcementContent.trim()}
        >
          <div className="flex items-center justify-center">
            <IoMdCreate className="mr-2" />
            Publish Announcement
          </div>
        </button>
      </div>
    </div>
  );

  const renderProjectModal = () => (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white rounded-3xl p-5 w-full max-w-2xl max-h-[95%] overflow-auto">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-bold text-gray-800">Create New Task</h3>
          <button
            onClick={() => setShowProjectModal(false)}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
          >
            <IoMdClose size={24} className="text-gray-600" />
          </button>
        </div>

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
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={projectStatus}
                onChange={(e) => setProjectStatus(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="ongoing">Ongoing</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                 Employees
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {selectedUsers.length > 0 ? selectedUsers.map(userId => {
                  const user = users.find(u => u.id === userId);
                  return user ? (
                    <div key={userId} className="flex items-center bg-blue-50 rounded-full px-3 py-1 border">
                      <img 
                        src={user.profile_image} 
                        className="w-6 h-6 rounded-full mr-2" 
                        alt={user.name}
                      />
                      <span className="text-sm text-gray-700">{user.name}</span>
                    </div>
                  ) : null;
                }) : (
                  <p className="text-sm text-gray-500">No employees assigned</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deadline
              </label>
              <input
                type="date"
                value={projectDeadline}
                onChange={(e) => setProjectDeadline(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={projectStartDate}
                onChange={(e) => setProjectStartDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manager
              </label>
              <input
                type="text"
                value={projectManager}
                onChange={(e) => setProjectManager(e.target.value)}
                placeholder="Project manager"
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
              />
            </div>
          

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Budget
            </label>
            <input
              type="text"
              value={projectBudget}
              onChange={(e) => setProjectBudget(e.target.value)}
              placeholder="e.g., ₱50,000"
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign Users
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
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
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

        <button
          onClick={createProject}
          className={`w-full py-4 rounded-xl font-bold text-white ${
            projectTitle.trim()
              ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
          disabled={!projectTitle.trim()}
        >
          <div className="flex items-center justify-center">
            <MdAddTask className="mr-2" />
            Create Project
          </div>
        </button>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "Home":
        return (
          <div className="p-5">
            {/* Welcome Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
              <p className="text-gray-500">Manage announcements, projects, and team communications</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-400 text-white rounded-2xl p-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{projects.length}</div>
                    <div className="text-sm opacity-90">Active Projects</div>
                  </div>
                  <MdDashboard size={24} className="opacity-80" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-400 text-white rounded-2xl p-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{announcements.length}</div>
                    <div className="text-sm opacity-90">Announcements</div>
                  </div>
                  <IoMdMegaphone size={24} className="opacity-80" />
                </div>
              </div>
            </div>

            {/* Recent Announcements */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">Announcements</h3>
                <button 
                  className="text-blue-500 text-sm font-medium flex items-center"
                  onClick={markAllAsRead}
                >
                  <MdCheckCircle className="mr-1" size={16} />
                  Mark all as read
                </button>
              </div>
              {announcements.slice(0, 4).map(renderAnnouncementCard)}
              {announcements.length > 4 && (
                <button 
                  className="w-full py-3 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50"
                  onClick={() => setSelectedFilter("all")}
                >
                  View all announcements
                </button>
              )}
            </div>
          </div>
        );

      case "Projects":
        return (
          <div className="p-5">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-800">All Projects</h1>
              <p className="text-gray-500">View and manage all ongoing projects</p>
            </div>

            {/* Project Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white rounded-2xl p-4 shadow">
                <div className="text-lg font-bold text-gray-800">{projects.length}</div>
                <div className="text-xs text-gray-500">Total Projects</div>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow">
                <div className="text-lg font-bold text-gray-800">
                  {projects.filter(p => p.status === "ongoing").length}
                </div>
                <div className="text-xs text-gray-500">Active Projects</div>
              </div>
            </div>

            {/* Projects List */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">Tasks List</h3>
                <button className="text-blue-500 text-sm font-medium">
                  Filter by status
                </button>
              </div>
              {projects.map(renderProjectCard)}
            </div>
          </div>
        );

      case "Announcements":
        return (
          <div className="p-5">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Announcements</h1>
              <p className="text-gray-500">Create and manage announcements</p>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search announcements..."
                  className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
              <button 
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedFilter === "all" 
                    ? "bg-blue-500 text-white shadow" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setSelectedFilter("all")}
              >
                All ({announcements.length})
              </button>
              <button 
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedFilter === "unread" 
                    ? "bg-blue-500 text-white shadow" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setSelectedFilter("unread")}
              >
                Unread ({announcements.filter(a => a.unread).length})
              </button>
              <button 
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedFilter === "important" 
                    ? "bg-blue-500 text-white shadow" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setSelectedFilter("important")}
              >
                Important ({announcements.filter(a => a.important).length})
              </button>
            </div>

            {/* Announcements List */}
            <div className="mb-8">
              {filteredAnnouncements.length > 0 ? (
                filteredAnnouncements.map(renderAnnouncementCard)
              ) : (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IoMdMegaphone size={24} className="text-gray-400" />
                  </div>
                  <h3 className="text-gray-600 font-medium">No announcements found</h3>
                  <p className="text-gray-400 text-sm mt-1">Try a different search or create a new announcement</p>
                </div>
              )}
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
              .then(res => res.json())
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
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-6 flex justify-between items-center text-white">
      <div className="flex items-center">
        <img 
          src={selectedFile || currentUser?.profile_image} 
          className="w-10 h-10 rounded-full border-2 border-white mr-3"
          alt="User"
        />
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
            <img 
              src={selectedFile || user?.profile_image} 
              className="w-28 h-28 rounded-full border-4 border-blue-100" 
              alt="Profile"
            />
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
    <div className="fixed inset-0 z-30 flex justify-center items-end">
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
            <img 
              src={selectedFile || currentUser?.profile_image} 
              className="w-10 h-10 rounded-full border-2 border-white cursor-pointer shadow"
              onClick={handleProfileClick}
              alt="Admin Avatar"
            />
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`transition-all duration-300 ${(profileOpen || showActionMenu) && isMobile ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        <div className="overflow-auto">
          {renderTabContent()}
        </div>
      </div>

      {/* Bottom Navbar */}
      {activeTab !== "My Location" && (
        <div className={`fixed bottom-0 left-0 w-full bg-white border-t border-gray-300 flex items-center justify-around py-2 z-10 transition-all duration-300 ${(profileOpen || showActionMenu) ? 'opacity-0 translate-y-10' : 'opacity-100 translate-y-0'}`}>
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
            className={`flex flex-col items-center relative ${activeTab === "Announcements" ? "text-blue-500" : "text-gray-500"}`}
            onClick={() => handleTabChange("Announcements")}
          >
            <IoMdMegaphone size={24} />
            <span className="text-xs mt-1">Announce</span>
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

      {/* Project Details Modal */}
      {showProjectDetailsModal && renderProjectDetailsModal()}

      {/* Comments Modal - Stack Navigation */}
      {showCommentsModal && renderCommentsModal()}
    </div>
  );
};

export default AdminDashboard;
