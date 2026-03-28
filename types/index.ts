export interface User {
  id: string;
  name: string;
  avatar: string;
  location: string;
  rating: number;
  totalTrades: number;
  memberSince: string;
  bio: string;
  verified: boolean;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: "New" | "Like New" | "Good" | "Fair";
  images: string[];
  owner: User;
  lookingFor: string;
  estimatedValue: number;
  postedDate: string;
  status: "available" | "pending" | "traded";
  tags: string[];
}

export interface ExchangeRequest {
  id: string;
  fromUser: User;
  toUser: User;
  offeredProduct: Product;
  requestedProduct: Product;
  status: "pending" | "accepted" | "rejected" | "completed";
  createdAt: string;
  message: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface Chat {
  id: string;
  tradeId: string;
  participants: User[];
  messages: Message[];
  product1: Product;
  product2: Product;
  status: "active" | "completed" | "cancelled";
}

export interface Notification {
  id: string;
  type: "request" | "accepted" | "message" | "completed";
  message: string;
  timestamp: string;
  read: boolean;
}