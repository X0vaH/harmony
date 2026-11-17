<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserCollection;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Models\Dm;
use App\Models\salon_members;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;
use function Laravel\Prompts\password;

class UserController extends Controller
{
    public function index() : UserCollection
    {
        $userActif = Auth::id();

        $users = User::where('id', '!=', $userActif)->get();
        return new UserCollection($users);
    }

    public function destroy(User $user) : UserResource
    {
        $user->delete();
        return new UserResource($user);
    }

    public function store(Request $request) : UserResource
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:users,name',
            'password' => 'required|string',
        ]);

        $validated['password'] = Hash::make($validated['password']);

        $user = User::create($validated);

        return new UserResource($user);
    }

    public function update(Request $request, User $user) : UserResource
    {
        $validated = $request->validate([
            'language' => 'string|in:fr,en',
            'light_mode' => 'boolean',
            'get_notifications' => 'boolean',
        ]);

        $user->update($validated);

        return new UserResource($user);
    }

    public function token(Request $request) {

        $request->validate([
            'name' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::where('name', $request->name)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Identifiants invalides.',
            ], 401); // 401 Unauthorized
        }

        $abilities = $user->is_admin ? ['admin'] : ['user'];
        $token = $user->createToken('token-name', $abilities)->plainTextToken;

        // Retourner le jeton au client
        return response()->json([
            'token' => $token,
            'user' => $user,
        ]);
    }

    public function logout(Request $request)
    {
        // Supprime le jeton d'accès
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Déconnexion réussie. Jeton révoqué.'
        ]);
    }


    public function show(User $user) : UserResource
    {
        return new UserResource($user);
    }

    public function setLanguage(int $user_id, string $lang) : UserResource
    {
        $user = User::findOrFail($user_id);
        $user->language = $lang;
        $user->save();
        return new UserResource($user);
    }

    public function setDarkMode(int $user_id, bool $bool_dark) : UserResource
    {
        $user = User::findOrFail($user_id);
        $user->dark_mode = $bool_dark;
        $user->save();
        return new UserResource($user);
    }

    public function refresh(Request $request)
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Utilisateur non authentifié.'
            ], 401);
        }

        $request->user()->currentAccessToken()->delete();

        $abilities = $user->is_admin ? ['admin'] : ['user'];
        $newToken = $user->createToken('token-name', $abilities)->plainTextToken;

        return response()->json([
            'message' => 'Nouveau jeton généré.',
            'token' => $newToken,
            'user' => $user
        ]);
    }

    public function presence(Request $request)
    {
        $data = $request->validate([
            'estPresent' => ['required', 'boolean'],
        ]);

        $user = User::where('id', $request->user_id)->first();
        $user->update([
            'estOnline' => $request->estPresent,
        ]);
    
        // Tous les DMs du user
        $dmIds = Dm::query()
            ->where('user_id1', $request->user_id)
            ->orWhere('user_id2', $request->user_id)
            ->pluck('id')
            ->all();
    
        // Tous les salons du user 
        $salonIds = salon_members::where('user_id', $request->user_id)
		->pluck('salon_id')
		->all();
    
        $channels = [];
    
        foreach ($dmIds as $dmId) {
            $channels[] = "dm.$dmId";
        }
        foreach ($salonIds as $sid) {
            $channels[] = "salon.$sid";
        }
    
        $channels = array_values(array_unique($channels));
    
        $payload = json_encode([
            "user_id" => $request->user_id,
            "estPresent" => $request->estPresent,
            'type'     => "presence",
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    
        foreach ($channels as $channel) {
            $payload = json_encode([
		"user_id" => $request->user_id,
		"estPresent" => $request->estPresent,
		"type" => "presence",
		"channel" => $channel,
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

	    Redis::publish($channel, $payload);
        }
    
        return response()->json([
            'ok'       => true,
            'channels' => $channels,
        ]);
    }
}

