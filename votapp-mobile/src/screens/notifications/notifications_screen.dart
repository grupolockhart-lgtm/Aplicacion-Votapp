

// src/screens/notifications/notifications_screen.dart

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class NotificationsScreen extends StatefulWidget {
  final int userId;
  const NotificationsScreen({Key? key, required this.userId}) : super(key: key);

  @override
  _NotificationsScreenState createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<dynamic> notifications = [];
  int unreadCount = 0;

  @override
  void initState() {
    super.initState();
    fetchNotifications();
    fetchUnreadCount();
  }

  Future<void> fetchNotifications() async {
    final response = await http.get(
      Uri.parse("http://127.0.0.1:8000/api/notifications?user_id=${widget.userId}"),
    );
    if (response.statusCode == 200) {
      setState(() {
        notifications = json.decode(response.body);
      });
    }
  }

  Future<void> fetchUnreadCount() async {
    final response = await http.get(
      Uri.parse("http://127.0.0.1:8000/api/notifications/unread_count?user_id=${widget.userId}"),
    );
    if (response.statusCode == 200) {
      setState(() {
        unreadCount = json.decode(response.body)["unread_count"];
      });
    }
  }

  Future<void> markAsRead(int notificationId) async {
    final response = await http.put(
      Uri.parse("http://127.0.0.1:8000/api/notifications/$notificationId/read"),
    );
    if (response.statusCode == 200) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }

  Future<void> deleteNotification(int notificationId) async {
    final response = await http.delete(
      Uri.parse("http://127.0.0.1:8000/api/notifications/$notificationId"),
    );
    if (response.statusCode == 200) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }

  Future<void> deleteAllNotifications() async {
    final response = await http.delete(
      Uri.parse("http://127.0.0.1:8000/api/notifications/all?user_id=${widget.userId}"),
    );
    if (response.statusCode == 200) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Notificaciones 🔔 ($unreadCount sin leer)"),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_forever),
            onPressed: deleteAllNotifications,
          ),
        ],
      ),
      body: ListView.builder(
        itemCount: notifications.length,
        itemBuilder: (context, index) {
          final notif = notifications[index];
          final isUnread = notif['status'] == 'unread';
          return ListTile(
            leading: Icon(
              isUnread ? Icons.notifications_active : Icons.notifications_none,
              color: isUnread ? Colors.red : Colors.grey,
            ),
            title: Text(notif['message']),
            subtitle: Text("Estado: ${notif['status']}"),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (isUnread)
                  ElevatedButton(
                    onPressed: () => markAsRead(notif['id']),
                    child: const Text("Marcar leída"),
                  ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: () => deleteNotification(notif['id']),
                  child: const Text("Eliminar"),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}