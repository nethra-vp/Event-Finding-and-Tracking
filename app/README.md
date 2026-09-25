# EventSync — Intelligent Event Discovery & Tracking Platform

## 📌 Overview

**EventSync** is an intelligent event discovery and tracking platform that helps users find local events, manage their RSVPs, and invite friends through shareable event links.

The platform combines the **Ticketmaster API** for real-time event discovery with **MongoDB** for persistent storage of user profiles, RSVPs, reminders, and friend invitation activity.

---

## 🎯 Problem Statement

Build a platform for **finding and tracking events** with an intelligent chat interface and real-time capabilities.

The platform should allow users to:

- Discover local events
- View events on a calendar
- Check event details
- RSVP to events
- Track their confirmed attendance
- Invite friends to events
- Track how many friends are attending

---

## ✨ Key Features

### 📅 Event Calendar

- Interactive calendar grid
- Highlights dates containing local events
- Allows users to browse events by date
- Displays event information based on the selected date

### 🎫 Event Cards

Each event card displays:

- Event title
- Venue
- Date
- Time
- Event details
- RSVP / **Interested** button
- **Friends Attending** count
- Share Link option for users who have RSVPed

### 🙋 RSVP Dashboard

A dedicated dashboard where users can:

- View all events they have RSVPed to
- Track upcoming events
- Manage their attendance
- Access event sharing options

### 🔎 Event Feed

The backend fetches event listings using the **Ticketmaster Discovery API**.

The event feed provides:

- Local events
- Event names
- Venues
- Dates and times
- Event URLs
- Event images where available

### 👥 Friend Invite System

Users who RSVP to an event can generate a unique **Share Link**.

Example:

```text
https://your-app.com/invite/

