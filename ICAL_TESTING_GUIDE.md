# iCal Availability Testing Guide

## What I Fixed

1. **Added CORS Proxy Support** - iCal URLs from external sources (like Airbnb, Booking.com) are now fetched through a CORS proxy to avoid browser security restrictions
2. **Enhanced Logging** - Added detailed console logs to help debug availability checking
3. **Better Date Handling** - Normalized time zones and set proper time boundaries for check-in (00:00) and check-out (23:59)
4. **Desktop/Laptop Support** - Removed mobile-only restriction so the app works on all devices

## How iCal Availability Works

When you add a hotel with an iCal calendar URL:
1. The app fetches the calendar feed from the URL
2. Parses all booking events using ical.js library
3. Checks if your selected dates overlap with any existing bookings
4. Displays availability status:
   - 🟢 **AVAILABLE** - No conflicts found
   - 🔴 **BOOKED** - Dates overlap with existing booking
   - ⚪ **Unknown** - No iCal URL provided or error fetching

## How to Test iCal Availability

### Step 1: Get a Test iCal URL

You can use one of these methods:

#### Option A: Generate Test iCal URL
Use this online tool to create a test calendar:
- Visit: https://ical.marudot.com/
- Create a few events with dates
- Copy the generated iCal URL

#### Option B: Use Airbnb Calendar
1. Go to your Airbnb listing (or create a test listing)
2. Navigate to Availability → Calendar sync
3. Export calendar and copy the iCal URL
4. Example format: `https://www.airbnb.com/calendar/ical/12345.ics?s=...`

#### Option C: Use Google Calendar
1. Go to Google Calendar settings
2. Find your calendar and click "Settings and sharing"
3. Scroll to "Integrate calendar"
4. Copy the "Secret address in iCal format"
5. Example: `https://calendar.google.com/calendar/ical/...`

#### Option D: Create Manual .ics File
Create a file named `test.ics` with this content:
```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//My Calendar//EN
BEGIN:VEVENT
UID:test-event-1@example.com
DTSTART:20251210T140000Z
DTEND:20251215T140000Z
SUMMARY:Test Booking
DESCRIPTION:This is a test booking
END:VEVENT
END:VCALENDAR
```
Host it on a public URL (GitHub Gist, Pastebin, etc.)

### Step 2: Add Hotel with iCal URL

1. Open the app and sign in
2. Click "Add New Homestay"
3. Fill in all required fields:
   - Name, City, Area, Address
   - Price and Price Type
   - Upload at least one image
   - **Important**: Paste your iCal URL in the "Calendar URL (iCal)" field
4. Submit the form

### Step 3: Test Availability Checking

1. Go to the Homestay Listing page
2. Select check-in and check-out dates using the date pickers
3. Watch the browser console (F12 → Console) for detailed logs:
   ```
   Fetching iCal from: https://...
   iCal data received, length: 1234
   Found 5 events in calendar
   Checking event: {...}
   No conflicts found - property is available
   ```
4. You should see availability badges on hotel cards:
   - Green "AVAILABLE" badge if dates are free
   - Red "BOOKED" badge if dates conflict

### Step 4: Verify Sorting

Hotels with "AVAILABLE" status should appear at the top of the list, followed by "Unknown" and "BOOKED" properties.

## Common Issues & Solutions

### Issue 1: "CORS Error" in Console
**Solution**: The app now uses a CORS proxy (`https://api.allorigins.win/raw?url=`). If this proxy is down, you can:
- Change the proxy URL in `src/App.js` line ~982
- Alternative proxies: `https://corsproxy.io/?`, `https://cors-anywhere.herokuapp.com/`

### Issue 2: Always Shows "Unknown"
**Check**:
1. Is the iCal URL correct and publicly accessible?
2. Open the iCal URL directly in browser - should download/show .ics file
3. Check console logs for errors
4. Verify the URL starts with `http://` or `https://`

### Issue 3: Wrong Availability Status
**Debug**:
1. Check console logs for event dates
2. Verify your check-in/check-out dates
3. Make sure iCal events have proper DTSTART and DTEND
4. Check time zones - events are converted to local time

### Issue 4: Slow Loading
**Cause**: Fetching multiple iCal URLs takes time
**Solution**: 
- The app shows a loading indicator: "Checking availability for X properties..."
- Consider caching results (future improvement)

## Testing Scenarios

### Scenario 1: Available Property
- iCal has bookings: Dec 1-5, Dec 20-25
- Search dates: Dec 10-15
- Expected: 🟢 AVAILABLE

### Scenario 2: Unavailable Property  
- iCal has booking: Dec 10-20
- Search dates: Dec 15-18 (overlaps)
- Expected: 🔴 BOOKED

### Scenario 3: Edge Case - Same Day
- iCal has booking: Dec 15 checkout
- Search dates: Dec 15 check-in
- Expected: Should be AVAILABLE (no overlap)

## Browser Console Commands

To manually test availability checking, open console (F12) and run:

```javascript
// Test a specific iCal URL
const testUrl = 'YOUR_ICAL_URL_HERE';
const checkIn = '2025-12-10';
const checkOut = '2025-12-15';

fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(testUrl))
  .then(r => r.text())
  .then(data => console.log('iCal Data:', data))
  .catch(e => console.error('Error:', e));
```

## Expected Console Output (Success)

```
Fetching iCal from: https://calendar.google.com/calendar/ical/...
iCal data received, length: 2847
Found 3 events in calendar
Checking event: {
  eventStart: "2025-12-01T00:00:00.000Z",
  eventEnd: "2025-12-05T00:00:00.000Z",
  checkIn: "2025-12-10T00:00:00.000Z",
  checkOut: "2025-12-15T23:59:59.999Z"
}
Checking event: {
  eventStart: "2025-12-20T00:00:00.000Z",
  eventEnd: "2025-12-25T00:00:00.000Z",
  checkIn: "2025-12-10T00:00:00.000Z",
  checkOut: "2025-12-15T23:59:59.999Z"
}
No conflicts found - property is available
```

## Next Steps

If availability checking is working:
- ✅ You'll see green "AVAILABLE" badges
- ✅ Available properties sorted to top
- ✅ Counter shows "X available • Y booked"

If still not working:
1. Share the console logs
2. Share a sample iCal URL you're testing
3. Share the dates you're searching
4. I can help debug further!

## Additional Resources

- iCal Format Specification: https://icalendar.org/
- ical.js Documentation: https://mozilla-comm.github.io/ical.js/
- Test iCal URLs: https://www.icalendar.org/validator.html
