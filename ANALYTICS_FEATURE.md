# Analytics Feature Documentation

## Overview
A comprehensive analytics tracking system has been added to the Homavia admin panel to monitor user engagement and traffic.

## Features

### 📊 Analytics Dashboard
Access via Admin Panel → Analytics tab

#### Key Metrics Tracked:
1. **Total Traffic** - Page views across all homestay listings
2. **Call Clicks** - Number of times users clicked the "Call" button
3. **WhatsApp Clicks** - Number of times users clicked the "WhatsApp" button
4. **Total Engagement** - Combined call + WhatsApp interactions

### 🕒 Time Range Filters
- **Today** - Analytics from midnight today
- **Week** - Last 7 days
- **Month** - Last 30 days
- **All Time** - Complete historical data

### 📝 Recent Activity Log
Shows the last 50 activities with:
- Event type (Page View 👁️, Call Click 📞, WhatsApp Click 💬)
- Homestay name (for call/WhatsApp events)
- Timestamp (date and time)
- Color-coded by event type

## Technical Implementation

### Firebase Collections
```
analytics/
├── eventType: 'page_view' | 'call_click' | 'whatsapp_click'
├── timestamp: Firestore Timestamp
├── homestayId: string (for interactions)
├── homestayName: string (for interactions)
├── pagePath: string (for page views)
└── pageTitle: string (for page views)
```

### Tracking Functions

#### `trackPageView(pagePath, pageTitle)`
Automatically called when a user visits a homestay detail page.
```javascript
trackPageView('/homestays/cozy-villa-guwahati-xyz123', 'Cozy Villa')
```

#### `trackCallClick(homestayId, homestayName)`
Called when user clicks the "Call" button on any homestay.
```javascript
trackCallClick('xyz123', 'Cozy Villa')
```

#### `trackWhatsAppClick(homestayId, homestayName)`
Called when user clicks the "WhatsApp" button on any homestay.
```javascript
trackWhatsAppClick('xyz123', 'Cozy Villa')
```

## Usage

### For Admin Users
1. Login with admin credentials (nilamroychoudhury216@gmail.com)
2. Navigate to `/admin`
3. Click on "Analytics" tab
4. View real-time statistics and recent activity
5. Use time range filters to analyze specific periods

### Data Privacy
- Only admin users can access analytics
- No personal user information is collected
- Only interaction counts and timestamps are stored
- Complies with privacy standards

## Future Enhancements
- [ ] Export analytics data to CSV
- [ ] Charts and graphs for visual trends
- [ ] Most popular homestays report
- [ ] Peak traffic time analysis
- [ ] Conversion rate tracking (views to contacts)
- [ ] Geographic analytics (city-wise breakdown)
- [ ] Email notifications for milestones
- [ ] Compare time periods (month vs month)

## Security
- Analytics data is stored in Firestore with proper security rules
- Only authenticated admin users can access the dashboard
- Tracking functions fail silently to not disrupt user experience
- All queries are limited to prevent excessive data fetching

## Performance
- Recent activity limited to 50 items for fast loading
- Indexed queries on timestamp field
- Time-range filters reduce data transfer
- Async tracking prevents blocking user interactions

## Maintenance
- Regularly review Firestore usage for billing
- Consider implementing data retention policy
- Archive old analytics data after 1 year
- Monitor for unusual patterns or spam

---

**Last Updated**: January 2, 2026
**Feature Status**: ✅ Production Ready
