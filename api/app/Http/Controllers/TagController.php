<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTagRequest;
use App\Http\Requests\UpdateTagRequest;
use App\Http\Resources\TagCollection;
use App\Http\Resources\TagResource;
use App\Models\Tag;
use Illuminate\Http\Request;

class TagController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): TagResource
    {
        $tags = Tag::all();
        return new TagResource($tags);
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
    public function store(Request $request): TagResource
    {
        $tag = Tag::create([
            'tag_name' => $request->tag_name,
            'message_id' => $request->message_id,
        ]);
        return new TagResource($tag);
    }

    /**
     * Display the specified resource.
     */
    public function show($message_id): TagResource
    {
        $tags = Tag::where('message_id', $message_id)->get();
        return new TagResource($tags);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Tag $tag)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $message_id): TagResource
    {

        $tag = Tag::where('message_id', $message_id)->first();
        $tag->update([
            'tag_name' => $request->tag_name,
        ]);
        return new TagResource($tag);

    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($message_id): TagResource
    {
        $tags = Tag::where('message_id', $message_id)->get();
        foreach ($tags as $tag) {
            $tag->delete();
        }
        return new TagResource($tags);
    }
}
