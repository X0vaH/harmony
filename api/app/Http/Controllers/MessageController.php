<?php

namespace App\Http\Controllers;

use App\Http\Resources\MessageCollection;
use App\Http\Resources\MessageResource;
use App\Models\Message;
use App\Models\PublicKey;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class MessageController extends Controller
{
    public function index(): MessageCollection
    {
        $messages = Message::all();
        return new MessageCollection($messages);
    }

    public function store(Request $request): MessageResource
    {

        $request->validate([
            'dm_id' => ['nullable', 'integer'],
            'salon_id' => ['nullable', 'integer'],
            'user_id' => ['required', 'integer'],
            'contenu' => ['required', 'string', 'max:1000'],
            'public_key' => ['nullable'],
        ]);

        $msg = Message::create([
            'dm_id' => $request->dm_id ?? null,
            'salon_id' => $request->salon_id ?? null,
            'user_id' => $request->user_id,
            'contenu' => $request->contenu,
            'date' => $request->date ?? now(),
            'public_key' => $request->public_key ?? null,
        ]);

        $channel = $msg->dm_id ? "dm.{$msg->dm_id}" : "salon.{$msg->salon_id}";

        $payload = json_encode([
            'id' => $msg->id,
            'dm_id' => $msg->dm_id,
            'salon_id' => $msg->salon_id,
            'user_id' => $msg->user_id,
            'contenu' => $msg->contenu,
            'type' => "message",
            'date' => $msg->date,
            'public_key' => $request->public_key ?? null
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        try {
            Redis::publish($channel, $payload);

            Log::info('[API] Redis publish ok', ['channel' => $channel, 'id' => $msg->id]);
        } catch (\Throwable $e) {
            Log::error('[API] Redis publish failed', [
                'channel' => $channel,
                'id' => $msg->id,
                'err' => $e->getMessage(),
            ]);
        }

        return new MessageResource($msg);
    }

    public function createDoublon(Request $request): MessageResource{

        $msg = Message::create([
            'dm_id' => $request->dm_id ?? null,
            'salon_id' => $request->salon_id ?? null,
            'user_id' => $request->user_id,
            'contenu' => $request->contenu,
            'date' => $request->date ?? now(),
            'public_key' => $request->public_key ?? null,
        ]);

        return new MessageResource($msg);
    }

    /**
     * Display the specified resource.
     */
    public function show(Message $message): MessageResource
    {
        return new MessageResource($message);
    }

    public function update(Request $request, Message $message): MessageResource
    {
        $message->update(['contenu' => $request->contenu]);
        return new MessageResource($message);
    }

    public function destroy(Message $message): MessageResource
    {
        $message->delete();
        return new MessageResource($message);
    }

    /**
     * Show all the dms for the specified user.
     */
    public function message_dmId($dmId): MessageCollection
    {
        $message_dmId = Message::where('dm_id', $dmId)->get();
        return new MessageCollection($message_dmId);
    }

    /**
     * montre tout les messages q'un user à écris dans un dm donné (avec les nouvelles clés, ca devrait
     * être tous les messages )
     */
    public function message_dmId_public_key($dmId, $publicKeyId): MessageCollection
    {
        $message_dmId = Message::where('dm_id', $dmId)->get();

        $publicKeyId = PublicKey::where('id', $publicKeyId)->first();

        $message_to_return = $message_dmId->filter(function ($message) use ($publicKeyId) {
            return $message->public_key == $publicKeyId->public_key;
        });


        return new MessageCollection($message_to_return);
    }

    public function all_message_by_keyId($publicKeyId)
    {
        $all_messages = Message::all();

        $publicKeyId = PublicKey::where('id', $publicKeyId)->first();

        $message_to_return = $all_messages->filter(function ($message) use ($publicKeyId) {
            return $message->public_key == $publicKeyId->public_key;
        });
    }



    /**
     * Show all the dms for the specified user.
     */
    public function message_salonId($salonId): MessageCollection
    {
        $message_salonId = Message::where('salon_id', $salonId)->get();
        return new MessageCollection($message_salonId);
    }
}
