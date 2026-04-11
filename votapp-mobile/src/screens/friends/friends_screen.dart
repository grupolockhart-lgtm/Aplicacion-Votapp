

// src/screens/friends/friends_screen.dart


import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class FriendsScreen extends StatefulWidget {
  final int userId;
  const FriendsScreen({Key? key, required this.userId}) : super(key: key);

  @override
  _FriendsScreenState createState() => _FriendsScreenState();
}

class _FriendsScreenState extends State<FriendsScreen> {
  List<dynamic> friends = [];

  @override
  void initState() {
    super.initState();
    fetchFriends();
  }

  Future<void> fetchFriends() async {
    final response = await http.get(
      Uri.parse("http://127.0.0.1:8000/api/friends?user_id=${widget.userId}"),
    );
    if (response.statusCode == 200) {
      setState(() {
        friends = json.decode(response.body);
      });
    }
  }

  Future<void> updateFriendStatus(int friendId, String action) async {
    final response = await http.put(
      Uri.parse("http://127.0.0.1:8000/api/friends/$friendId?action=$action"),
    );
    if (response.statusCode == 200) {
      fetchFriends(); // refresca la lista
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Amigos")),
      body: ListView.builder(
        itemCount: friends.length,
        itemBuilder: (context, index) {
          final friend = friends[index];
          return ListTile(
            leading: const Icon(Icons.person),
            title: Text("Usuario ${friend['friend_id']}"),
            subtitle: Text("Estado: ${friend['status']}"),
            trailing: friend['status'] == 'pending'
                ? Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      ElevatedButton(
                        onPressed: () =>
                            updateFriendStatus(friend['id'], 'accepted'),
                        child: const Text("Aceptar"),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton(
                        onPressed: () =>
                            updateFriendStatus(friend['id'], 'rejected'),
                        child: const Text("Rechazar"),
                      ),
                    ],
                  )
                : ElevatedButton(
                    onPressed: () {
                      // Navegar al perfil del amigo
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => FriendProfileScreen(
                            friendId: friend['friend_id'],
                          ),
                        ),
                      );
                    },
                    child: const Text("Ver perfil"),
                  ),
          );
        },
      ),
    );
  }
}

class FriendProfileScreen extends StatelessWidget {
  final int friendId;
  const FriendProfileScreen({Key? key, required this.friendId})
      : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("Perfil Usuario $friendId")),
      body: Center(child: Text("Aquí va la info del usuario $friendId")),
    );
  }
}