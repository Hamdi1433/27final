import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load();

  final supabaseUrl = 'https://vknslclbxqvzsftwimfp.supabase.co';
  final supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbnNsY2xieHF2enNmdHdpbWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NTQwNjQsImV4cCI6MjA2NjUzMDA2NH0.tUCZQstKdZ1nJLnwdXfxBua12J60css7azbYWGVyw_Q';

  await Supabase.initialize(url: supabaseUrl, anonKey: supabaseKey);

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Test Supabase',
      home: const SupabaseTestScreen(),
    );
  }
}

class SupabaseTestScreen extends StatefulWidget {
  const SupabaseTestScreen({super.key});
  @override
  State<SupabaseTestScreen> createState() => _SupabaseTestScreenState();
}

class _SupabaseTestScreenState extends State<SupabaseTestScreen> {
  String _result = 'Test de connexion en cours...';

  @override
  void initState() {
    super.initState();
    _testSupabase();
  }

  Future<void> _testSupabase() async {
    final response = await Supabase.instance.client.from('users').select().limit(1).execute();
    setState(() {
      if (response.error != null) {
        _result = 'Erreur de connexion Supabase: ${response.error!.message}';
      } else {
        _result = 'Connexion Supabase OK, données: ${response.data}';
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Test Supabase')),
      body: Center(child: Text(_result)),
    );
  }
}
