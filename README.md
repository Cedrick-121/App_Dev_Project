# STI CampusFlow

A front-end prototype for **STI CampusFlow**, an appointment booking portal for STI College
Global City. Students reserve a slot for Registrar, Library, or Lab services, and staff manage
those requests from an admin dashboard — all in a single static page.

## Features

- **Booking form** — students enter their name, 11-digit student number, permit type, and a
  preferred date/time.
- **Status tracker** — a live card shows the student's most recent request moving from
  *Pending* to *Approved*.
- **Admin dashboard** — a toggleable view lists all requests in a sortable, searchable table.
- **Toast notifications** for booking confirmations and admin actions.

## Running it

This is a static site with no build step or dependencies. Clone the repo and open
`index.html` in a browser, or serve the folder with any static file server, e.g.:

```bash
npx serve .
```

## Tech stack

Vanilla HTML, CSS, and JavaScript — no frameworks or backend. Data is simulated in
`script.js` for demo purposes.

## Project structure

```
index.html    Markup for the student and admin views
style.css     Styling
script.js     Booking form, admin table, and toast logic
```
