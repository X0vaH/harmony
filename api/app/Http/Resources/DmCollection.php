<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;

class DmCollection extends ResourceCollection
{
    /** Chaque item est rendu via DmResource */
    public $collects = DmResource::class;

    public function toArray($request)
    {
        // Laisse Laravel sérialiser chaque item via DmResource
        return parent::toArray($request);
    }
}
