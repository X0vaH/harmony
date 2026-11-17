<?php

namespace App\Http\Controllers;

use App\Models\Friend;
use Illuminate\Http\Request;

class FriendController extends Controller
{
    public function sendRequest(Request $request)
    {
        $receiverId = $request->receiver_id;
        $senderId = auth()->id();

        if ($receiverId == $senderId) {
            return response()->json(['message' => "Impossible de s'ajouter soi-même"], 400);
        }

        $friend = Friend::firstOrCreate(
            [
                'sender_id' => $senderId,
                'receiver_id' => $receiverId
            ],
            ['status' => 'pending']
        );

        if ($friend->wasRecentlyCreated) {
            return response()->json(['message' => 'Demande envoyée']);
        } else {
            return response()->json(['message' => 'Relation déjà existante']);
        }
    }

    public function sentPendingRequests()
    {
        $user = auth()->id();

        return Friend::where('sender_id', $user)
            ->where('status', 'pending')
            ->with('receiver')
            ->get();
    }

    public function acceptRequest($id)
    {
        $friend = Friend::findOrFail($id);

        if ($friend->receiver_id != auth()->id()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $friend->update(['status' => 'accepted']);

        return response()->json(['message' => 'Demande acceptée']);
    }

    public function declineRequest($id)
    {
        $friend = Friend::findOrFail($id);

        if ($friend->receiver_id != auth()->id()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $friend->update(['status' => 'declined']);

        return response()->json(['message' => 'Demande refusée']);
    }

    public function listFriends()
    {
        $user = auth()->user();

        $friends = Friend::where(function($q) use ($user) {
            $q->where('sender_id', $user->id)
                ->where('status', 'accepted');
        })->orWhere(function($q) use ($user) {
            $q->where('receiver_id', $user->id)
                ->where('status', 'accepted');
        })
            ->with(['sender', 'receiver'])
            ->get();

        return response()->json($friends);
    }

    public function pendingRequests()
    {
        $user = auth()->id();

        return Friend::where('receiver_id', $user)
            ->where('status', 'pending')
            ->with('sender')
            ->get();
    }
}
