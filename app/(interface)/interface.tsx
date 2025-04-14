export interface user {
  id: string;
  createdAt: string;
  email: string;
  isOnline: string;
  password: string;
  profilePic: string;
  updatedAt: string;
  name: string;
}

export interface chats {
  id: string;
  createdAt: Date;
  lastMessage: string | null;
  members: Array<string>;
  updatedAt: Date;
}

export interface Message {
  chatId: string;
  senderId: string;
  text: string;
  timestamp: Date; // If you convert Firestore Timestamp to JS Date
}
