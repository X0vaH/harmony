<?php

namespace App\Http\Controllers;

use App\Http\Resources\PrivateKeyResource;
use App\Models\PrivateKey;
use Illuminate\Http\Request;

class PrivateKeyController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request) : PrivateKeyResource
    {
        $privateKey = PrivateKey::create([
            'private_key' => $request->private_key,
            'iv' => $request->iv,
            'user_id' => $request->user_id,
        ]);
        return new PrivateKeyResource($privateKey);
    }

    /**
     * Display the specified resource.
     */
    public function show($userId) : PrivateKeyResource
    {
        $privateKey = PrivateKey::where('user_id', $userId)->firstOrFail();
        return new PrivateKeyResource($privateKey);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(PrivateKey $privateKey)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, PrivateKey $privateKey)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($userId)
    {
        $privateKey = PrivateKey::where('user_id', $userId)->firstOrFail();
        $privateKey->delete();
        return new PrivateKeyResource($privateKey);
    }
}
