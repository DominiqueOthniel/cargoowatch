// Supabase Database Operations
const supabase = require('./supabase-config');

// Shipments operations
async function readShipments() {
    try {
        const { data, error } = await supabase
            .from('shipments')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Error reading shipments from Supabase:', error);
            return [];
        }

        // Transform Supabase data to match JSON structure
        return data.map(transformShipmentFromDB);
    } catch (error) {
        console.error('❌ Error reading shipments:', error);
        return [];
    }
}

async function writeShipments(shipments) {
    // Note: This function is kept for backward compatibility
    // In Supabase, we update individual shipments instead
    console.log('⚠️ writeShipments() called - use updateShipment() or createShipment() instead');
    return true;
}

async function createShipment(shipment) {
    try {
        const dbShipment = transformShipmentToDB(shipment);
        
        const { data, error } = await supabase
            .from('shipments')
            .insert([dbShipment])
            .select()
            .single();

        if (error) {
            console.error('❌ Error creating shipment in Supabase:', error);
            return null;
        }

        return transformShipmentFromDB(data);
    } catch (error) {
        console.error('❌ Error creating shipment:', error);
        return null;
    }
}

async function updateShipment(trackingId, updates) {
    try {
        const dbUpdates = transformShipmentToDB(updates);
        dbUpdates.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('shipments')
            .update(dbUpdates)
            .eq('tracking_id', trackingId)
            .select()
            .single();

        if (error) {
            console.error('❌ Error updating shipment in Supabase:', error);
            return null;
        }

        return transformShipmentFromDB(data);
    } catch (error) {
        console.error('❌ Error updating shipment:', error);
        return null;
    }
}

async function getShipmentByTrackingId(trackingId) {
    try {
        const { data, error } = await supabase
            .from('shipments')
            .select('*')
            .eq('tracking_id', trackingId.toUpperCase())
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // Not found
                return null;
            }
            console.error('❌ Error fetching shipment from Supabase:', error);
            return null;
        }

        return transformShipmentFromDB(data);
    } catch (error) {
        console.error('❌ Error fetching shipment:', error);
        return null;
    }
}

// Transform functions: Convert between JSON structure and DB structure
function transformShipmentToDB(shipment) {
    return {
        id: shipment.id,
        tracking_id: shipment.trackingId,
        status: shipment.status,
        created_at: shipment.createdAt,
        updated_at: shipment.updatedAt,
        delivered_at: shipment.deliveredAt,
        
        // Sender
        sender_name: shipment.sender?.name,
        sender_email: shipment.sender?.email,
        sender_phone: shipment.sender?.phone,
        sender_address: shipment.sender?.address || {},
        
        // Recipient
        recipient_name: shipment.recipient?.name,
        recipient_email: shipment.recipient?.email,
        recipient_phone: shipment.recipient?.phone,
        recipient_address: shipment.recipient?.address || {},
        
        // Package
        package_type: shipment.package?.type,
        package_weight: shipment.package?.weight,
        package_dimensions: shipment.package?.dimensions || {},
        package_description: shipment.package?.description,
        package_value: shipment.package?.value,
        package_currency: shipment.package?.currency || 'USD',
        package_vehicle: shipment.package?.vehicle || {},
        
        // Service
        service_type: shipment.service?.type,
        service_priority: shipment.service?.priority,
        service_insurance: shipment.service?.insurance || false,
        
        // Events
        events: shipment.events || [],
        
        // Cost
        cost_base: shipment.cost?.base,
        cost_shipping: shipment.cost?.shipping,
        cost_insurance: shipment.cost?.insurance,
        cost_total: shipment.cost?.total,
        cost_currency: shipment.cost?.currency || 'USD',
        
        // Location
        estimated_delivery: shipment.estimatedDelivery,
        current_location: shipment.currentLocation || {},
        
        // Auto progress
        auto_progress: shipment.autoProgress || {
            enabled: true,
            paused: false,
            pausedAt: null,
            pauseReason: null,
            pausedDuration: 0,
            startedAt: null,
            lastUpdate: null
        },
        
        // Receipt
        receipt: shipment.receipt,
        receipt_uploaded_at: shipment.receiptUploadedAt
    };
}

function transformShipmentFromDB(dbShipment) {
    return {
        id: dbShipment.id,
        trackingId: dbShipment.tracking_id,
        status: dbShipment.status,
        createdAt: dbShipment.created_at,
        updatedAt: dbShipment.updated_at,
        deliveredAt: dbShipment.delivered_at,
        
        sender: {
            name: dbShipment.sender_name,
            email: dbShipment.sender_email,
            phone: dbShipment.sender_phone,
            address: dbShipment.sender_address || {}
        },
        
        recipient: {
            name: dbShipment.recipient_name,
            email: dbShipment.recipient_email,
            phone: dbShipment.recipient_phone,
            address: dbShipment.recipient_address || {}
        },
        
        package: {
            type: dbShipment.package_type,
            weight: dbShipment.package_weight,
            dimensions: dbShipment.package_dimensions || {},
            description: dbShipment.package_description,
            value: dbShipment.package_value,
            currency: dbShipment.package_currency || 'USD',
            vehicle: dbShipment.package_vehicle || {}
        },
        
        service: {
            type: dbShipment.service_type,
            priority: dbShipment.service_priority,
            insurance: dbShipment.service_insurance || false
        },
        
        events: dbShipment.events || [],
        
        cost: {
            base: dbShipment.cost_base,
            shipping: dbShipment.cost_shipping,
            insurance: dbShipment.cost_insurance,
            total: dbShipment.cost_total,
            currency: dbShipment.cost_currency || 'USD'
        },
        
        estimatedDelivery: dbShipment.estimated_delivery,
        currentLocation: dbShipment.current_location || {},
        
        autoProgress: dbShipment.auto_progress || {
            enabled: true,
            paused: false,
            pausedAt: null,
            pauseReason: null,
            pausedDuration: 0,
            startedAt: null,
            lastUpdate: null
        },
        
        receipt: dbShipment.receipt,
        receiptUploadedAt: dbShipment.receipt_uploaded_at
    };
}

// Users operations
async function readUsers() {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*');

        if (error) {
            console.error('❌ Error reading users from Supabase:', error);
            return [];
        }

        return data.map(transformUserFromDB);
    } catch (error) {
        console.error('❌ Error reading users:', error);
        return [];
    }
}

async function createUser(user) {
    try {
        const dbUser = transformUserToDB(user);
        
        const { data, error } = await supabase
            .from('users')
            .insert([dbUser])
            .select()
            .single();

        if (error) {
            console.error('❌ Error creating user in Supabase:', error);
            return null;
        }

        return transformUserFromDB(data);
    } catch (error) {
        console.error('❌ Error creating user:', error);
        return null;
    }
}

async function getUserByEmail(email) {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email.toLowerCase())
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            console.error('❌ Error fetching user from Supabase:', error);
            return null;
        }

        return transformUserFromDB(data);
    } catch (error) {
        console.error('❌ Error fetching user:', error);
        return null;
    }
}

function transformUserToDB(user) {
    return {
        id: user.id,
        username: user.username,
        email: user.email,
        password: user.password,
        first_name: user.firstName || user.first_name,
        last_name: user.lastName || user.last_name,
        role: user.role || 'user',
        created_at: user.createdAt || user.created_at,
        updated_at: user.updatedAt || user.updated_at
    };
}

function transformUserFromDB(dbUser) {
    return {
        id: dbUser.id,
        username: dbUser.username,
        email: dbUser.email,
        password: dbUser.password,
        firstName: dbUser.first_name,
        lastName: dbUser.last_name,
        role: dbUser.role,
        createdAt: dbUser.created_at,
        updatedAt: dbUser.updated_at
    };
}

// Chats operations (simplified - using chat_conversations and chat_messages)
async function readChats() {
    try {
        // Get conversations with their messages
        const { data: conversations, error } = await supabase
            .from('chat_conversations')
            .select(`
                *,
                chat_messages (
                    id,
                    text,
                    image,
                    sender_type,
                    sender_name,
                    sender_id,
                    read,
                    created_at
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Error reading chats from Supabase:', error);
            return [];
        }

        // Transform to match JSON structure
        return conversations.map(conv => ({
            id: conv.id,
            clientName: conv.client_name,
            clientEmail: conv.client_email,
            subject: conv.subject,
            trackingId: conv.tracking_id,
            status: conv.status,
            createdAt: conv.created_at,
            updatedAt: conv.updated_at,
            messages: (conv.chat_messages || []).map(msg => ({
                id: msg.id,
                text: msg.text,
                image: msg.image,
                senderType: msg.sender_type,
                senderName: msg.sender_name,
                timestamp: msg.created_at,
                read: msg.read
            })),
            assignedTo: conv.assigned_to
        }));
    } catch (error) {
        console.error('❌ Error reading chats:', error);
        return [];
    }
}

async function writeChats(chats) {
    // This function is kept for backward compatibility
    // In Supabase, we update individual conversations and messages
    console.log('⚠️ writeChats() called - use updateChatConversation() instead');
    return true;
}

module.exports = {
    // Shipments
    readShipments,
    writeShipments,
    createShipment,
    updateShipment,
    getShipmentByTrackingId,
    
    // Users
    readUsers,
    createUser,
    getUserByEmail,
    
    // Chats
    readChats,
    writeChats
};

