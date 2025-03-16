// notifications.data.ts
import * as fs from 'fs';
import * as path from 'path';

// const filePath = path.resolve(__dirname, 'notifications.json');
const filePath = path.resolve(process.cwd(), 'src/common/notifications.json');

// Read notifications from the file
function readNotifications() {
    console.log({filePath})
  if (fs.existsSync(filePath)) {
    console.log('Existsss')
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  }

  console.log('Nope....')
  return []; // Return an empty array if the file doesn't exist
}

// Write notifications to the file
function writeNotifications(notifications: any[]) {
  fs.writeFileSync(filePath, JSON.stringify(notifications, null, 2));
}

// Export functions to read and write notifications
export const notifications = {
  get: readNotifications,
  set: writeNotifications,
};