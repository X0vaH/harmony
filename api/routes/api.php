<?php

use App\Http\Controllers\BackgroundDmController;
use App\Http\Controllers\DmController;
use App\Http\Controllers\FriendController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\PrivateKeyController;
use App\Http\Controllers\PublicKeyController;
use App\Http\Controllers\SalonController;
use App\Http\Controllers\SalonMembersController;
use App\Http\Controllers\TagController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\UserProfilePictureController;
use App\Http\Middleware\isAdmin;
use App\Models\UserProfilePicture;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Redis;

Route::prefix('user')
    ->controller(UserController::class)
    ->group(function () {
        // Route de connexion/génération de jeton
        Route::post('/token', 'token')->middleware('throttle:login');
        Route::post('/', 'store');
    });

Route::middleware('auth:sanctum')->group(function () {
// Route de déconnexion
    Route::post('/logout', [UserController::class, 'logout']);

    Route::prefix('messages')
        ->controller(MessageController::class)
        ->group(function () {
            Route::get('/', 'index')->middleware(isAdmin::class);
            Route::post('/', 'store');
            Route::get('/{message}', 'show');
            Route::put('/{message}', 'update');
            Route::get('/{dmId}/message', 'message_dmId');
            Route::get('/{salonId}/salon/message', 'message_salonId');
            Route::delete('/{message}', 'destroy')->middleware(isAdmin::class);
            Route::get('/{dmId}/{key}', 'message_dmId_public_key');
            Route::post('/double', 'createDoublon');
        });

    Route::prefix('dms')
        ->controller(DmController::class)
        ->group(function () {
            Route::get('/', 'index')->middleware(isAdmin::class);
            Route::post('/', 'store');
            Route::get('/{dm}', 'show');
            Route::put('/{dm}', 'update');
            Route::get('/user/{userId}', 'dms_user');
            Route::get('/user/{userId}/other', 'dms_other_user');
            Route::delete('/{dm}', 'destroy')->middleware(isAdmin::class);
            Route::get('/entre/{userId1}/{userId2}', 'getDmEntreUsers');
            Route::post('/{dm}/typing', 'typing');
        });

    Route::prefix('user')
        ->controller(UserController::class)
        ->group(function () {
            Route::patch('/{user}', 'update');
            Route::post('/refresh', 'refresh');
            Route::get('/', 'index');
            Route::delete('/{user}', 'destroy')->middleware(isAdmin::class);
            Route::get('/{user}', 'show');
            Route::put('/{user}/setDarkMode', 'setDarkMode');
            Route::put('/{user}/setLanguage', 'setLanguage');
            Route::post('/{user}/presence', 'presence');
        });


    Route::prefix('keys')
        ->controller(PublicKeyController::class)
        ->group(function () {
            Route::post('/', 'store');
            Route::get('/{user_id}', 'show');
            Route::patch('/{user_id}', 'update');
            Route::delete('/{user_id}', 'destroy');
        });

    Route::prefix('privateKeys')
        ->controller(PrivateKeyController::class)
        ->group(function () {
            Route::post('/', 'store');
            Route::get('/{user_id}', 'show');
            Route::delete('/{user_id}', 'destroy');
        });

    Route::prefix('tags')
        ->controller(TagController::class)
        ->group(function () {
            Route::get('/', 'index');
            Route::post('/', 'store');
            Route::get('/{message_id}', 'show');
            Route::put('/{message_id}', 'update');
            Route::delete('/{message_id}', 'destroy');
        });


    Route::prefix('salons')
        ->controller(SalonController::class)
        ->group(function () {
            Route::get('/', 'index');
            Route::post('/', 'store');
            Route::get('/{salon}', 'show');
            Route::get('/public', 'getSalonsPublic');
            Route::patch('/{salon}', 'update');
            Route::delete('/{salon}', 'destroy')->middleware(isAdmin::class);
        });

    Route::prefix('salons_members')
        ->controller(SalonMembersController::class)
        ->group(function () {
            Route::get('/', 'index');
            //get les id de toutes les user qui font partis d'un salon
            Route::get('/{salon}/members', 'members');
            //get les id de tous les salons ou un certain user fait partis prive ou public
            Route::get('/{user}/salons', 'salons_user');
            // permet de rajouter un membre a un salon
            Route::post('salons/members', 'store');
            // permet de retirer un membre d'un salon
            Route::delete('/{salon}/members/{user}', 'removeMember');
            // get les users qui ne sont pas membres d'un salon
            Route::get('/{salon}/notmembers', 'getNotMembers');
            // get les salons public dont un certain user fait partis
            Route::get('/public/notMembers/{user}', 'getSalonsPublicUserNotMember');
        });

    Route::prefix('friends')
        ->controller(FriendController::class)
        ->group(function () {
            Route::get('/', 'listFriends');
            Route::get('/requests', 'pendingRequests');
            Route::get('/sent-requests', 'sentPendingRequests');
            Route::post('/send', 'sendRequest');
            Route::put('/accept/{id}', 'acceptRequest');
            Route::put('/decline/{id}', 'declineRequest');
    });
    Route::prefix('backgroundDm')
        ->controller(BackgroundDmController::class)
        ->group(function () {
            Route::post('/', 'store');
            Route::get('/{dmId}', 'show');
        });

    Route::prefix('user-profile-picture')
        ->controller(UserProfilePictureController::class)
        ->group(function () {
            Route::delete('/{user}', 'destroy')->middleware(isAdmin::class);
            Route::get('/{user}', 'show');
            Route::post('/', 'store');
        });

    Route::prefix('friends')
        ->controller(FriendController::class)
        ->group(function () {
            Route::get('/', 'listFriends');
            Route::get('/requests', 'pendingRequests');
            Route::get('/sent-requests', 'sentPendingRequests');
            Route::post('/send', 'sendRequest');
            Route::put('/accept/{id}', 'acceptRequest');
            Route::put('/decline/{id}', 'declineRequest');
    });
});

Route::get('/heartbeat', function () {
    Redis::publish('heartbeat.1', json_encode([
        'type' => 'heartbeat',
    ]));
});
