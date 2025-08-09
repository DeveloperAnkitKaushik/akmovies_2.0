'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Topbar from '@/components/Topbar';
import { getServers, addServer, updateServer, deleteServer, getAllUsers, getUserHistoryForAdmin } from '@/utils/firestore';
import { validateAdminAccess, logAdminAction, checkRateLimit, getAdminInfo } from '@/utils/admin';
import { FaPlus, FaTrash, FaEdit, FaSave, FaTimes, FaGripVertical } from 'react-icons/fa';
import styles from './page.module.css';

export default function AdminPage() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const [servers, setServers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingServer, setEditingServer] = useState(null);
    const [newServer, setNewServer] = useState({ name: '', url: '' });

    // User management state
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userHistory, setUserHistory] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [activeTab, setActiveTab] = useState('servers'); // 'servers' or 'users'

    // Validate admin access
    const adminValidation = validateAdminAccess(user, isAuthenticated);
    const isAdmin = adminValidation.isAdmin;
    const adminInfo = getAdminInfo(user);

    // Redirect non-admin users to home page
    useEffect(() => {
        if (isAuthenticated && !isAdmin) {
            toast.error(`Access denied: ${adminValidation.reason}`);
            router.push('/');
        }
    }, [isAuthenticated, isAdmin, router, adminValidation.reason]);

    // Dynamic title based on admin state
    useEffect(() => {
        if (!isAuthenticated) {
            document.title = 'Admin Panel | AKMovies';
        } else if (!isAdmin) {
            document.title = 'Access Denied | AKMovies';
        } else if (loading) {
            document.title = 'Loading Admin Panel | AKMovies';
        } else {
            document.title = `Admin Panel (${servers.length} servers) | AKMovies`;
        }
    }, [isAuthenticated, isAdmin, loading, servers.length]);

    useEffect(() => {
        if (isAdmin) {
            fetchServers();
            fetchUsers();
        }
    }, [isAdmin]);

    const fetchServers = async () => {
        try {
            setLoading(true);
            const serversData = await getServers();
            setServers(serversData);
            logAdminAction(user, 'fetch_servers', { count: serversData.length });
        } catch (error) {
            console.error('Error fetching servers:', error);
            toast.error('Failed to fetch servers');
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = async (result) => {
        if (!result.destination) return;

        if (!checkRateLimit('reorder_servers', 5, 60000)) {
            toast.error('Too many reorder attempts. Please wait a moment.');
            return;
        }

        const items = Array.from(servers);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setServers(items);

        // Update order numbers in Firebase
        try {
            const updatePromises = items.map((server, index) => {
                return updateServer(server.id, {
                    ...server,
                    order_number: index + 1
                });
            });

            await Promise.all(updatePromises);
            logAdminAction(user, 'reorder_servers', {
                fromIndex: result.source.index,
                toIndex: result.destination.index,
                serverName: reorderedItem.name
            });
            toast.success('Server order updated successfully');
        } catch (error) {
            console.error('Error updating server order:', error);
            toast.error('Failed to update server order');
            // Revert to original order
            fetchServers();
        }
    };

    const handleAddServer = async (e) => {
        e.preventDefault();

        if (!checkRateLimit('add_server', 3, 60000)) {
            toast.error('Too many add attempts. Please wait a moment.');
            return;
        }

        if (!newServer.name.trim() || !newServer.url.trim()) {
            toast.error('Please fill in all fields');
            return;
        }

        try {
            const serverData = {
                name: newServer.name.trim(),
                url: newServer.url.trim(),
                order_number: servers.length + 1
            };

            await addServer(serverData);
            logAdminAction(user, 'add_server', serverData);
            setNewServer({ name: '', url: '' });
            setShowAddForm(false);
            fetchServers();
            toast.success('Server added successfully');
        } catch (error) {
            console.error('Error adding server:', error);
            toast.error('Failed to add server');
        }
    };

    const handleEditServer = async (e) => {
        e.preventDefault();

        if (!checkRateLimit('edit_server', 5, 60000)) {
            toast.error('Too many edit attempts. Please wait a moment.');
            return;
        }

        if (!editingServer.name.trim() || !editingServer.url.trim()) {
            toast.error('Please fill in all fields');
            return;
        }

        try {
            await updateServer(editingServer.id, {
                name: editingServer.name.trim(),
                url: editingServer.url.trim(),
                order_number: editingServer.order_number
            });

            logAdminAction(user, 'edit_server', {
                serverId: editingServer.id,
                oldName: editingServer.name,
                newName: editingServer.name.trim(),
                newUrl: editingServer.url.trim()
            });
            setEditingServer(null);
            fetchServers();
            toast.success('Server updated successfully');
        } catch (error) {
            console.error('Error updating server:', error);
            toast.error('Failed to update server');
        }
    };

    const handleDeleteServer = async (serverId) => {
        if (!checkRateLimit('delete_server', 2, 60000)) {
            toast.error('Too many delete attempts. Please wait a moment.');
            return;
        }

        if (!confirm('Are you sure you want to delete this server?')) return;

        try {
            const serverToDelete = servers.find(s => s.id === serverId);
            await deleteServer(serverId);
            logAdminAction(user, 'delete_server', {
                serverId,
                serverName: serverToDelete?.name,
                serverUrl: serverToDelete?.url
            });
            fetchServers();
            toast.success('Server deleted successfully');
        } catch (error) {
            console.error('Error deleting server:', error);
            toast.error('Failed to delete server');
        }
    };

    const startEditing = (server) => {
        setEditingServer({ ...server });
    };

    const cancelEditing = () => {
        setEditingServer(null);
    };

    const fetchUsers = async () => {
        try {
            setLoadingUsers(true);
            const usersData = await getAllUsers();
            setUsers(usersData);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to fetch users');
        } finally {
            setLoadingUsers(false);
        }
    };

    const fetchUserHistory = async (userId) => {
        try {
            setLoadingHistory(true);
            const historyData = await getUserHistoryForAdmin(userId);
            setUserHistory(historyData);
        } catch (error) {
            console.error('Error fetching user history:', error);
            toast.error('Failed to fetch user history');
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleUserSelect = (user) => {
        setSelectedUser(user);
        fetchUserHistory(user.id);
    };

    // Show loading while checking authentication
    if (!isAuthenticated) {
        return (
            <div className={styles.container}>
                <Topbar name="Admin Panel" />
                <div className="main-container">
                    <div className={styles.authPrompt}>
                        <h2>Authentication Required</h2>
                        <p>Please log in to access the admin panel.</p>
                    </div>
                </div>
            </div>
        );
    }

    // Show access denied for non-admin users
    if (!isAdmin) {
        return (
            <div className={styles.container}>
                <Topbar name="Admin Panel" />
                <div className="main-container">
                    <div className={styles.authPrompt}>
                        <h2>Access Denied</h2>
                        <p>You don't have permission to access the admin panel.</p>
                        <p>Reason: {adminValidation.reason}</p>
                        <p>Contact the administrator if you believe this is an error.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <Topbar name="Admin Panel" />
            <div className="main-container">
                <div className={styles.content}>
                    <div className={styles.header}>
                        <h1>Admin Panel</h1>
                        {adminInfo && (
                            <div className={styles.adminInfo}>
                                <span>Logged in as: {adminInfo.email}</span>
                                {adminInfo.isVerified && (
                                    <span className={styles.verifiedBadge}>✓ Verified</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Tab Navigation */}
                    <div className={styles.tabNavigation}>
                        <button
                            className={`${styles.tabButton} ${activeTab === 'servers' ? styles.active : ''}`}
                            onClick={() => setActiveTab('servers')}
                        >
                            Server Management
                        </button>
                        <button
                            className={`${styles.tabButton} ${activeTab === 'users' ? styles.active : ''}`}
                            onClick={() => setActiveTab('users')}
                        >
                            User Management ({users.length})
                        </button>
                    </div>

                    {/* Server Management Tab */}
                    {activeTab === 'servers' && (
                        <>
                            <div className={styles.sectionHeader}>
                                <h2>Server Management</h2>
                                <button
                                    className={styles.addButton}
                                    onClick={() => setShowAddForm(true)}
                                >
                                    <FaPlus /> Add Server
                                </button>
                            </div>

                            {loading ? (
                                <div className={styles.loading}>
                                    <div className={styles.spinner}></div>
                                    <p>Loading servers...</p>
                                </div>
                            ) : (
                                <>
                                    {showAddForm && (
                                        <div className={styles.formOverlay}>
                                            <div className={styles.formContainer}>
                                                <div className={styles.formHeader}>
                                                    <h3>Add New Server</h3>
                                                    <button
                                                        className={styles.closeButton}
                                                        onClick={() => setShowAddForm(false)}
                                                    >
                                                        <FaTimes />
                                                    </button>
                                                </div>
                                                <form onSubmit={handleAddServer} className={styles.form}>
                                                    <div className={styles.formGroup}>
                                                        <label htmlFor="serverName">Server Name</label>
                                                        <input
                                                            type="text"
                                                            id="serverName"
                                                            value={newServer.name}
                                                            onChange={(e) => setNewServer({ ...newServer, name: e.target.value })}
                                                            placeholder="Enter server name"
                                                            required
                                                        />
                                                    </div>
                                                    <div className={styles.formGroup}>
                                                        <label htmlFor="serverUrl">Server URL</label>
                                                        <input
                                                            type="url"
                                                            id="serverUrl"
                                                            value={newServer.url}
                                                            onChange={(e) => setNewServer({ ...newServer, url: e.target.value })}
                                                            placeholder="https://example.com/embed"
                                                            required
                                                        />
                                                    </div>
                                                    <div className={styles.formActions}>
                                                        <button type="button" onClick={() => setShowAddForm(false)} className={styles.cancelButton}>
                                                            Cancel
                                                        </button>
                                                        <button type="submit" className={styles.saveButton}>
                                                            <FaSave /> Add Server
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    )}

                                    <div className={styles.serversSection}>
                                        <p className={styles.sectionDescription}>
                                            Drag and drop servers to reorder them. The order determines the display order on the watch page.
                                        </p>

                                        <DragDropContext onDragEnd={handleDragEnd}>
                                            <Droppable droppableId="servers">
                                                {(provided) => (
                                                    <div
                                                        {...provided.droppableProps}
                                                        ref={provided.innerRef}
                                                        className={styles.serversList}
                                                    >
                                                        {servers.map((server, index) => (
                                                            <Draggable key={server.id} draggableId={server.id} index={index}>
                                                                {(provided, snapshot) => (
                                                                    <div
                                                                        ref={provided.innerRef}
                                                                        {...provided.draggableProps}
                                                                        className={`${styles.serverItem} ${snapshot.isDragging ? styles.dragging : ''}`}
                                                                    >
                                                                        <div className={styles.serverContent}>
                                                                            <div {...provided.dragHandleProps} className={styles.dragHandle}>
                                                                                <FaGripVertical />
                                                                            </div>

                                                                            {editingServer?.id === server.id ? (
                                                                                <form onSubmit={handleEditServer} className={styles.editForm}>
                                                                                    <div className={styles.editInputs}>
                                                                                        <input
                                                                                            type="text"
                                                                                            value={editingServer.name}
                                                                                            onChange={(e) => setEditingServer({ ...editingServer, name: e.target.value })}
                                                                                            placeholder="Server name"
                                                                                            required
                                                                                        />
                                                                                        <input
                                                                                            type="url"
                                                                                            value={editingServer.url}
                                                                                            onChange={(e) => setEditingServer({ ...editingServer, url: e.target.value })}
                                                                                            placeholder="Server URL"
                                                                                            required
                                                                                        />
                                                                                    </div>
                                                                                    <div className={styles.editActions}>
                                                                                        <button type="button" onClick={cancelEditing} className={styles.cancelButton}>
                                                                                            <FaTimes />
                                                                                        </button>
                                                                                        <button type="submit" className={styles.saveButton}>
                                                                                            <FaSave />
                                                                                        </button>
                                                                                    </div>
                                                                                </form>
                                                                            ) : (
                                                                                <>
                                                                                    <div className={styles.serverInfo}>
                                                                                        <div className={styles.serverName}>{server.name}</div>
                                                                                        <div className={styles.serverUrl}>{server.url}</div>
                                                                                        <div className={styles.serverOrder}>Order: {server.order_number}</div>
                                                                                    </div>
                                                                                    <div className={styles.serverActions}>
                                                                                        <button
                                                                                            onClick={() => startEditing(server)}
                                                                                            className={styles.editButton}
                                                                                            title="Edit server"
                                                                                        >
                                                                                            <FaEdit />
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={() => handleDeleteServer(server.id)}
                                                                                            className={styles.deleteButton}
                                                                                            title="Delete server"
                                                                                        >
                                                                                            <FaTrash />
                                                                                        </button>
                                                                                    </div>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </Draggable>
                                                        ))}
                                                        {provided.placeholder}
                                                    </div>
                                                )}
                                            </Droppable>
                                        </DragDropContext>

                                        {servers.length === 0 && (
                                            <div className={styles.emptyState}>
                                                <p>No servers found. Add your first server to get started.</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* User Management Tab */}
                        </>
                    )}
                    {activeTab === 'users' && (
                        <div className={styles.usersSection}>
                            <div className={styles.sectionHeader}>
                                <h2>User Management ({users.length})</h2>
                                <button
                                    className={styles.addButton}
                                    onClick={fetchUsers}
                                    title="Refresh users"
                                >
                                    <FaPlus /> Refresh Users
                                </button>
                            </div>
                            <p className={styles.sectionDescription}>
                                Manage user accounts and their viewing history.
                            </p>

                            {loadingUsers ? (
                                <div className={styles.loading}>
                                    <div className={styles.spinner}></div>
                                    <p>Loading users...</p>
                                </div>
                            ) : (
                                <div className={styles.usersList}>
                                    {users.map((user) => (
                                        <div
                                            key={user.id}
                                            className={`${styles.userItem} ${selectedUser?.id === user.id ? styles.selected : ''}`}
                                            onClick={() => handleUserSelect(user)}
                                        >
                                            <div className={styles.userInfo}>
                                                <div className={styles.userName}>{user.displayName || user.email}</div>
                                                <div className={styles.userEmail}>{user.email}</div>
                                            </div>
                                            <div className={styles.userActions}>
                                                <button
                                                    onClick={() => handleUserSelect(user)}
                                                    className={styles.viewHistoryButton}
                                                    title="View history"
                                                >
                                                    <FaEdit />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {users.length === 0 && (
                                        <div className={styles.emptyState}>
                                            <p>No users found. New users will be added automatically.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {selectedUser && (
                                <div className={styles.userHistory}>
                                    <h3>History for {selectedUser.displayName || selectedUser.email}</h3>
                                    {loadingHistory ? (
                                        <div className={styles.loading}>
                                            <div className={styles.spinner}></div>
                                            <p>Loading history...</p>
                                        </div>
                                    ) : (
                                        <div className={styles.historyList}>
                                            {userHistory.map((item, index) => (
                                                <div key={index} className={styles.historyItem}>
                                                    <div className={styles.historyDate}>
                                                        {item.timestamp ?
                                                            (item.timestamp.toDate ?
                                                                new Date(item.timestamp.toDate()).toLocaleString() :
                                                                new Date(item.timestamp).toLocaleString()
                                                            ) : 'Unknown'
                                                        }
                                                    </div>
                                                    <div className={styles.historyTitle}>{item.title}</div>
                                                    <div className={styles.historyType}>Type: {item.mediaType}</div>
                                                    {item.season && item.episode && (
                                                        <div className={styles.historyEpisode}>
                                                            Season {item.season}, Episode {item.episode}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {userHistory.length === 0 && (
                                                <div className={styles.emptyState}>
                                                    <p>No history found for this user.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
