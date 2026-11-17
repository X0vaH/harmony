<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;

class BackgroundDmCollection extends ResourceCollection
{
    public $collects = BackgroundDmResource::class;

    public function toArray($request)
    {
        return parent::toArray($request);
    }
}
