<?php

namespace App\Controllers;

use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class PostController extends Controller
{
    public function handlePost(Request $request, int $id) {
        $data = $request->all();
        $post = Post::where(['id' => $id])->firstOr(function() use ($data) {
            return new Post($data);
        });
        $post->update($data);
        $post->save();
    }
}
