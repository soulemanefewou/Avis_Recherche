<?php

namespace App\Exception;

class MaxPhotosReachedException extends \Exception
{
    public function __construct()
    {
        parent::__construct(
            'Un avis de recherche ne peut pas contenir plus de 5 photos.',
            400
        );
    }
}