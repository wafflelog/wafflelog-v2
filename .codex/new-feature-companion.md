New feature: Companion task list

Companion feature logic flow:

- Find someone to invite
  - search by Username OR Email
    - if user is already on the app…
      - show the user card that contains
        - invite button
        - add connection (like phone contacts, no acceptance is needed)
          - what for? easier adding people to trip again
    - If user is not on the app.....
      - invite by sharable link
        - the link bring user to register
    - can also share link to existing user to join the trip
- invite response
  - invite withdrawn….
    - everything remain the same, except invitee will see error message when accepting
  - invitee accepted…
    - success message, trip shown in the app
  - invitee rejected….
    - trip owner got notification
- co-editing…
  - co editor can only…
    - add pins
    - add trip/pin expense
    - add trip/pin images
    - add trip/pin doc
    - add trip/pin links
    - add comment to all pins/trip
    -
- leave trip
  - ask invitee do they wanna keep their records
    - yes, no-op
    - no, soft deletes
- user management?
  - make things simpler
  - trip owner is the only admin
  - remove invitee
    - confirm, soft delete user and their pin
