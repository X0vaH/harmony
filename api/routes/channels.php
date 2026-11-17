<?php

use Illuminate\Support\Facades\Broadcast;
//Petit commentaire pour tester le deploy automatique via github actions
Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('dm.{dmId}', function (User $user, int $dmId) {
    return $user->dms()->where('dm_id', $dmId)->exists();
});

Broadcast::channel('salon.{salonId}', function (User $user, int $salonId) {
    return $user->salons()->where('salon_id', $salonId)->exists();
});

Broadcast::channel('presence.1', function ($user, $id) {
    return true;
});
