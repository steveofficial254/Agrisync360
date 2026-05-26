from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.community import CommunityPost, CommunityComment, CommunityLike
from app.models.user import User

community_bp = Blueprint('community', __name__, url_prefix='/api/community')

@community_bp.route('/posts', methods=['POST'])
@jwt_required()
def create_post():
    data = request.get_json()
    title = data.get('title')
    content = data.get('content')
    category = data.get('category')
    crop_tags = data.get('crop_tags')
    
    if not title or not content:
        return jsonify({"success": False, "message": "Title and content required"}), 400
        
    user_id = get_jwt_identity()
    post = CommunityPost(user_id=user_id, title=title, content=content, category=category, crop_tags=crop_tags)
    db.session.add(post)
    db.session.commit()
    
    return jsonify({"success": True, "data": post.to_dict(), "message": "Post created successfully"}), 201

@community_bp.route('/posts', methods=['GET'])
def get_posts():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    category = request.args.get('category')
    crop = request.args.get('crop')
    
    query = CommunityPost.query
    
    if category:
        query = query.filter_by(category=category)
    
    if crop:
        query = query.filter(CommunityPost.crop_tags.contains([crop]))
    
    query = query.order_by(CommunityPost.created_at.desc())
    
    posts_page = query.paginate(page=page, per_page=per_page, error_out=False)
    
    if not posts_page.items:
        return jsonify({
            "success": True,
            "data": {
                "posts": [],
                "total": 0,
                "pages": 0,
                "current_page": page,
            },
            "message": "No posts found"
        }), 200
    
    # Get user info for each post
    posts_data = []
    for post in posts_page.items:
        post_dict = post.to_dict()
        user = User.query.get(post.user_id)
        if user:
            post_dict['author'] = {
                'phone': user.phone,
                'role': user.role
            }
        # Add like and comment counts
        post_dict['likes_count'] = CommunityLike.query.filter_by(post_id=post.id).count()
        post_dict['comments_count'] = CommunityComment.query.filter_by(post_id=post.id).count()
        posts_data.append(post_dict)
    
    return jsonify({
        "success": True,
        "data": {
            "posts": posts_data,
            "total": posts_page.total,
            "pages": posts_page.pages,
            "current_page": page,
        },
        "message": "Posts retrieved"
    }), 200

@community_bp.route('/posts/<post_id>', methods=['GET'])
def get_post(post_id):
    post = CommunityPost.query.get(post_id)
    
    if not post:
        return jsonify({"success": False, "message": "Post not found"}), 404
    
    post_dict = post.to_dict()
    user = User.query.get(post.user_id)
    if user:
        post_dict['author'] = {
            'phone': user.phone,
            'role': user.role
        }
    
    # Get comments
    comments = CommunityComment.query.filter_by(post_id=post_id, parent_id=None).order_by(CommunityComment.created_at.asc()).all()
    post_dict['comments'] = [c.to_dict() for c in comments]
    
    # Check if current user liked
    user_id = get_jwt_identity() if request.headers.get('Authorization') else None
    if user_id:
        liked = CommunityLike.query.filter_by(post_id=post_id, user_id=user_id).first()
        post_dict['user_liked'] = bool(liked)
    else:
        post_dict['user_liked'] = False
    
    post_dict['likes_count'] = CommunityLike.query.filter_by(post_id=post_id).count()
    post_dict['comments_count'] = CommunityComment.query.filter_by(post_id=post_id).count()
    
    return jsonify({"success": True, "data": post_dict, "message": "Post retrieved"}), 200

@community_bp.route('/posts/<post_id>/comments', methods=['POST'])
@jwt_required()
def add_comment(post_id):
    post = CommunityPost.query.get(post_id)
    if not post:
        return jsonify({"success": False, "message": "Post not found"}), 404
    
    data = request.get_json()
    content = data.get('content')
    parent_id = data.get('parent_id')
    
    if not content:
        return jsonify({"success": False, "message": "Content is required"}), 400
    
    user_id = get_jwt_identity()
    comment = CommunityComment(post_id=post_id, user_id=user_id, content=content, parent_id=parent_id)
    db.session.add(comment)
    db.session.commit()
    
    return jsonify({"success": True, "data": comment.to_dict(), "message": "Comment added"}), 201

@community_bp.route('/posts/<post_id>/like', methods=['POST'])
@jwt_required()
def toggle_like(post_id):
    post = CommunityPost.query.get(post_id)
    if not post:
        return jsonify({"success": False, "message": "Post not found"}), 404
    
    user_id = get_jwt_identity()
    existing_like = CommunityLike.query.filter_by(post_id=post_id, user_id=user_id).first()
    
    if existing_like:
        db.session.delete(existing_like)
        db.session.commit()
        return jsonify({"success": True, "data": {"liked": False}, "message": "Like removed"}), 200
    else:
        like = CommunityLike(post_id=post_id, user_id=user_id)
        db.session.add(like)
        db.session.commit()
        return jsonify({"success": True, "data": {"liked": True}, "message": "Post liked"}), 201

@community_bp.route('/stats', methods=['GET'])
def get_stats():
    total_posts = CommunityPost.query.count()
    total_comments = CommunityComment.query.count()
    total_likes = CommunityLike.query.count()
    
    return jsonify({
        "success": True,
        "data": {
            "total_posts": total_posts,
            "total_comments": total_comments,
            "total_likes": total_likes
        },
        "message": "Stats retrieved"
    }), 200
