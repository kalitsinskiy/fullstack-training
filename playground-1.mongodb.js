use('santa-api');

db.rooms.find({}, { name: 1, inviteCode: 1 }).toArray();
