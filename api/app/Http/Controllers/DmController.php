<?php

namespace App\Http\Controllers;

use App\Events\UserTyping;
use App\Http\Resources\DmCollection;
use App\Http\Resources\DmResource;
use App\Http\Resources\UserCollection;
use App\Models\Dm;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class DmController extends Controller
{
    /**
     * GET /api/dms
     */
    public function index(): DmCollection
    {
        $dms = Dm::all();
        return new DmCollection($dms);
    }

    /**
     * Display the specified resource.
     */
    public function show(Dm $dm) : DmResource
    {
        return new DmResource($dm);
    }

    /**
     * POST /api/dms
     * body: { "user_id1": 1, "user_id2": 2 }
     * Crée (ou retourne) le DM pour cette paire
     */
    public function store(Request $request): DmResource
    {
        $data = $request->validate([
            'user_id1' => ['required','integer','different:user_id2','exists:users,id'],
            'user_id2' => ['required','integer','exists:users,id'],
        ]);

        $u1 = $data['user_id1'];
        $u2 = $data['user_id2'];

        $existing = Dm::where(function ($q) use ($u1, $u2) {
            $q->where('user_id1', $u1)->where('user_id2', $u2);
        })
            ->orWhere(function ($q) use ($u1, $u2) {
                $q->where('user_id1', $u2)->where('user_id2', $u1);
            })
            ->first();

        if ($existing) {
            return new DmResource($existing);
        }

        $dm = Dm::create(['user_id1' => $u1, 'user_id2' => $u2]);
        return new DmResource($dm);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Dm $dm) : DmResource
    {
        $dm->update([
            'user_id1' => $request->user_id1,
            'user_id2' => $request->user_id2,
        ]);

        return new DmResource($dm);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Dm $dm) : DmResource
    {
        $dm->delete();
        return new DmResource($dm);
    }

    /**
     * Show all the dms for the specified user.
     */
    public function dms_user($userId): DmCollection
    {
        $dms_users = Dm::where('user_id1', $userId)
            ->orWhere('user_id2', $userId)
            ->get();

        return new DmCollection($dms_users);
    }

    /**
     * Show all the dms for the specified user.
     */
    public function dms_other_user($userId): UserCollection
    {
        $dms = Dm::query()
            ->where('user_id1', $userId)
            ->orWhere('user_id2', $userId)
            ->get(['user_id1', 'user_id2']);

        $otherIds = $dms->map(fn($dm) => (int) ($dm->user_id1 == $userId ? $dm->user_id2 : $dm->user_id1))
            ->unique()
            ->values();

        $otherUsers = User::whereIn('id', $otherIds)->get();

        return new UserCollection($otherUsers);
    }

    /**
     * Get le DM entre deux users
     * @param $userId1 - id d'un des user (usualy celui qui est connecté mais pas obligé))
     * @param $userId2 - id de l'autre user
     * @return DmResource
     */
    public function getDmEntreUsers($userId1, $userId2): DmResource
    {
        $dm = Dm::where(function($query) use ($userId1, $userId2) {
            $query->where('user_id1', $userId1)
                ->where('user_id2', $userId2);
        })
            ->orWhere(function($query) use ($userId1, $userId2) {
                $query->where('user_id1', $userId2)
                    ->where('user_id2', $userId1);
            })
            ->first();

        return new DmResource($dm);
    }

    public function typing(Request $request)
    {
        $data = $request->validate([
            'user_id'  => ['required', 'integer'],
            'isTyping' => ['required', 'boolean'],
            'channel'  => ['required', 'string'],
        ]);

        $userId   = $data['user_id'];
        $isTyping = $data['isTyping'];
        $channel  = $data['channel'];

        $payload = json_encode([
            'user_id'  => $userId,
            'isTyping' => $isTyping,
            'channel' => $channel,
            'type'     => "typing"
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        try {
            Redis::publish($channel, $payload);
            Log::info('[API] Typing publish ok', ['channel' => $channel, 'user_id' => $userId, 'isTyping' => $isTyping]);

            return response()->json(['ok' => true]);
        } catch (\Throwable $e) {
            Log::error('[API] Typing publish failed', [
                'channel' => $channel,
                'user_id' => $userId,
                'err'     => $e->getMessage(),
            ]);
            return response()->json(['error' => 'Redis publish failed'], 500);
        }
    }

}
