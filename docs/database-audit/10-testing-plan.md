# Testing Plan

## Persistence proof (per domain)

Create → DB row → reload → logout/login → still present.

## Negative authz

- Subscriber cannot grant admin
- Creator A cannot edit Creator B posts
- Unauthenticated cannot read premium content
- Non-admin cannot insert notifications for others

## Fake-data regression

Admin dashboard must not show literal `$7,280` or cases=`3` unless from query.  
Creator earnings must not list Alex J. / Sarah K. / Mike C.

## Unit

- `calculatePlatformFee`
- result vocabulary normalization
- entitlement redaction
