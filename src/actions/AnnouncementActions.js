const Announcement = require('../models/Announcement');

exports.getAnnouncement = ({userId, scopes}) => {
    const today = new Date();

    if (scopes.length === 1 && scopes.includes('user')) {
        scopes.push('non-plan-user');
    }

    const query = {
        start_time: {
            $lte: today
        },
        end_time: {
            $gte: today
        },
        send_to: {
            $in: [].concat.apply([], [userId, scopes, 'all_users'])
        },
        read_by: {
            $nin: [userId]
        }
    }

    return Announcement.find(query)
        .then(announcements => {
            if (Array.isArray(announcements) && announcements.length === 0) {
                return {}
            }

            const individualAnnouncements = announcements.filter(a => a.send_to.includes(userId))
            const groupAnnouncements = announcements.filter(a => (scopes.some(scp => a.send_to.includes(scp))));
            const globalAnnouncements = announcements.filter(a => a.send_to.includes('all_users'));

            if (individualAnnouncements.length) {
                return Promise.resolve(individualAnnouncements[0])
            } else if (groupAnnouncements.length) {
                return Promise.resolve(groupAnnouncements[0])
            } else if (globalAnnouncements.length) {
                return Promise.resolve(globalAnnouncements[0])
            }

            return announcements[0];
        })
}

exports.getAnnouncementV2 = ({userId, scopes}) => {
    if (scopes.length === 1 && scopes.includes('user')) {
        scopes.push('non-plan-user')
    }

    const query = {
        send_to: {
            $in: [].concat.apply([],[userId, scopes, "all_users"]),
        }
    }

    return Announcement.find(query).sort({created_at: -1})
        .then(announcements => {
            if (Array.isArray(announcements) && announcements.length === 0) {
                return []
            }

            return announcements.map(announcement => {
                const read_by = announcement.read_by
                if (read_by.indexOf(userId.toString()) !== -1) {
                    return Object.assign({}, announcement.toJSON(), {read: true})
                }
                return Object.assign({}, announcement.toJSON(), {read: false})
            })
        })
}

exports.markRead = ({userId, announcementId}) => {
    if (!userId || !announcementId) {
        throw new Error('Missing some required info');
    }

    return Announcement.update({
        _id: announcementId
    }, {
        $push: {
            read_by: userId
        }
    })
}

exports.createAnnouncement = ({start_time, end_time, description, send_to, title}) => {
    const announcement = new Announcement({
        title,
        description,
        start_time,
        end_time,
        send_to
    });

    announcement.save()
}

exports.countUnread = async (userId, scopes) => {
    if (scopes.length === 1 && scopes.includes('user')) {
        scopes.push('non-plan-user')
    }

    const query = {
        read_by: {
            $nin: [userId]
        },
        send_to: {
            $in: [].concat.apply([],[userId, scopes, "all_users"])
        }
    }

    return Announcement.count(query)
}