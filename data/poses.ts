/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { PosePreset, TwoModelPosePreset } from '../types';

type PoseCategory = {
    label: string;
    poses: Omit<PosePreset, 'isPreset' | 'previewImageUrl'>[];
}

type PoseLibraryData = {
    [key: string]: PoseCategory;
}

const posesData: PoseLibraryData = {
    standing: {
      label: '🕴️ Standing Poses',
      poses: [
        { id: 'stand-1', name: 'Classic Power Stance', description: 'Feet shoulder-width apart, hands on hips or crossing arms. Creates strong, confident presence.', prompt: `The model should stand with feet positioned shoulder-width apart, weight evenly distributed on both legs. 
Both hands are confidently placed on the hips, with elbows bent at approximately 90 degrees and pointing 
outward. The model's chest is lifted, shoulders are pulled back and down, and the posture is completely 
upright and commanding. The face displays a direct, confident gaze straight toward the camera with a 
neutral or subtle smile. The body should face the camera frontally. This stance conveys strength, 
professionalism, and self-assurance. Ensure no leaning or weight shift to one side.`, instruction: `The model should stand with feet positioned shoulder-width apart, weight evenly distributed on both legs. 
Both hands are confidently placed on the hips, with elbows bent at approximately 90 degrees and pointing 
outward. The model's chest is lifted, shoulders are pulled back and down, and the posture is completely 
upright and commanding. The face displays a direct, confident gaze straight toward the camera with a 
neutral or subtle smile. The body should face the camera frontally. This stance conveys strength, 
professionalism, and self-assurance. Ensure no leaning or weight shift to one side.`, direction: 'Front, 3/4' },
        { id: 'stand-2', name: 'Hip Pop Lean', description: 'Weight on one hip, body angled, creates flattering silhouette highlighting curves.', prompt: `The model should shift their weight entirely onto their right leg, with the left leg slightly bent and 
hip pushed out to the left side. The body should be angled approximately 45 degrees to the right, with 
the right hip noticeably higher than the left hip, creating an S-curve. The right arm should rest naturally 
on or near the right hip with a gentle hand placement. The left arm can hang naturally at the side or be 
positioned with the hand near the left hip. The torso should tilt slightly to accommodate the hip pop. 
The face should turn slightly toward the camera with a relaxed, confident expression.`, instruction: `The model should shift their weight entirely onto their right leg, with the left leg slightly bent and 
hip pushed out to the left side. The body should be angled approximately 45 degrees to the right, with 
the right hip noticeably higher than the left hip, creating an S-curve. The right arm should rest naturally 
on or near the right hip with a gentle hand placement. The left arm can hang naturally at the side or be 
positioned with the hand near the left hip. The torso should tilt slightly to accommodate the hip pop. 
The face should turn slightly toward the camera with a relaxed, confident expression.`, direction: 'Front, 3/4' },
        { id: 'stand-3', name: 'Over-the-Shoulder Look', description: 'Back to camera, torso twisted to look over shoulder. Mysterious and alluring.', prompt: `The model should stand with their back fully to the camera, feet positioned naturally together or 
slightly apart. The shoulders should remain relaxed and facing away. The model should twist the upper 
torso and head over their right shoulder to look back toward the camera. The twist should originate 
from the waist, with the lower body remaining still and facing away from the camera. The head should 
turn approximately 120-150 degrees to look over the shoulder. The expression should be calm, mysterious, 
or intriguing. The garment's back should be fully visible while the face is partially visible over the shoulder.

SPINE & TORSO TWIST REQUIREMENTS:
- The twist must originate from the waist and upper torso. The hips and lower body should remain facing mostly away from the camera.
- The head and shoulders must not rotate more than a natural 120-150 degrees. The model should be looking over their shoulder, not directly behind them.
- Ensure the shoulders and hips maintain a realistic rotational relationship; they cannot twist independently beyond natural human limits.`, instruction: `The model should stand with their back fully to the camera, feet positioned naturally together or 
slightly apart. The shoulders should remain relaxed and facing away. The model should twist the upper 
torso and head over their right shoulder to look back toward the camera. The twist should originate 
from the waist, with the lower body remaining still and facing away from the camera. The head should 
turn approximately 120-150 degrees to look over the shoulder. The expression should be calm, mysterious, 
or intriguing. The garment's back should be fully visible while the face is partially visible over the shoulder.

SPINE & TORSO TWIST REQUIREMENTS:
- The twist must originate from the waist and upper torso. The hips and lower body should remain facing mostly away from the camera.
- The head and shoulders must not rotate more than a natural 120-150 degrees. The model should be looking over their shoulder, not directly behind them.
- Ensure the shoulders and hips maintain a realistic rotational relationship; they cannot twist independently beyond natural human limits.`, direction: 'Back, Profile' },
        { id: 'stand-4', name: 'Three-Quarter Turn', description: 'Body at 45-degree angle, one shoulder closer, adds depth and dimension.', prompt: `The model should stand with their body positioned at a 45-degree angle to the camera, with the right 
shoulder closer to the camera than the left shoulder. Both feet should be planted firmly on the ground 
with natural weight distribution. The model's hips and shoulders should both be at this same 45-degree 
angle, creating dimensional depth. The head can face directly toward the camera or turn slightly to match 
the body angle. Both arms should hang naturally at the sides or be positioned with purpose. The face should 
display confidence and look directly at the camera.`, instruction: `The model should stand with their body positioned at a 45-degree angle to the camera, with the right 
shoulder closer to the camera than the left shoulder. Both feet should be planted firmly on the ground 
with natural weight distribution. The model's hips and shoulders should both be at this same 45-degree 
angle, creating dimensional depth. The head can face directly toward the camera or turn slightly to match 
the body angle. Both arms should hang naturally at the sides or be positioned with purpose. The face should 
display confidence and look directly at the camera.`, direction: '3/4 view' },
        { id: 'stand-5', name: 'Profile Elegance', description: 'Complete profile view. Perfect for showcasing facial features and body line.', prompt: `The model should stand in a complete side profile view, with their body turned exactly 90 degrees to the 
camera. The left side of the body should face the camera. Both feet should be firmly planted on the ground 
with natural posture. The head should also remain in profile, facing directly left. The chin should be 
slightly lifted, and the jawline should be clearly visible and defined. The shoulders should be relaxed 
but not slouched. Both arms should hang naturally at the sides or be positioned elegantly. The torso should 
be upright with good posture. The garment should drape naturally along the side of the body.`, instruction: `The model should stand in a complete side profile view, with their body turned exactly 90 degrees to the 
camera. The left side of the body should face the camera. Both feet should be firmly planted on the ground 
with natural posture. The head should also remain in profile, facing directly left. The chin should be 
slightly lifted, and the jawline should be clearly visible and defined. The shoulders should be relaxed 
but not slouched. Both arms should hang naturally at the sides or be positioned elegantly. The torso should 
be upright with good posture. The garment should drape naturally along the side of the body.`, direction: 'Profile/Side' },
        { id: 'stand-6', name: 'Hands in Pockets', description: 'Casual confidence with hands tucked into pockets. Relaxed yet stylish.', prompt: `The model should stand facing the camera with feet positioned naturally, shoulder-width apart or slightly 
closer. Both hands should be relaxed and inserted into the front pockets of the garment with thumbs either 
inside or outside of the pockets visible. The shoulders should be relaxed and dropped naturally. The posture 
should be upright but casual, conveying approachability and confidence. The weight should be evenly distributed 
or slightly shifted to one leg for a more relaxed feel. The face should display a neutral or warm expression, 
looking directly at the camera. The body should not be rigidly stiff but rather naturally relaxed.`, instruction: `The model should stand facing the camera with feet positioned naturally, shoulder-width apart or slightly 
closer. Both hands should be relaxed and inserted into the front pockets of the garment with thumbs either 
inside or outside of the pockets visible. The shoulders should be relaxed and dropped naturally. The posture 
should be upright but casual, conveying approachability and confidence. The weight should be evenly distributed 
or slightly shifted to one leg for a more relaxed feel. The face should display a neutral or warm expression, 
looking directly at the camera. The body should not be rigidly stiff but rather naturally relaxed.`, direction: 'Front, 3/4' },
        { id: 'stand-7', name: 'One Leg Forward', description: 'One leg extended forward, creates dynamic movement and elongates body.', prompt: `The model should stand with the left leg extended slightly forward, with that foot placed in front of the 
body's center line. The right leg should remain relatively straight or slightly bent, carrying most of the 
body weight approximately 60%. The front leg's knee can be slightly bent or straight. The hips should shift 
naturally to accommodate this stance, with the front hip slightly forward. The upper body should remain mostly 
upright and face toward the camera. Both arms should hang naturally at the sides or be positioned with one arm 
forward and one arm back to create movement. The face should look directly at the camera with a confident, 
engaged expression.`, instruction: `The model should stand with the left leg extended slightly forward, with that foot placed in front of the 
body's center line. The right leg should remain relatively straight or slightly bent, carrying most of the 
body weight approximately 60%. The front leg's knee can be slightly bent or straight. The hips should shift 
naturally to accommodate this stance, with the front hip slightly forward. The upper body should remain mostly 
upright and face toward the camera. Both arms should hang naturally at the sides or be positioned with one arm 
forward and one arm back to create movement. The face should look directly at the camera with a confident, 
engaged expression.`, direction: 'Front, 3/4' },
        { id: 'stand-8', name: 'S-Curve Pose', description: 'Shoulders and hips lean in opposite directions, highlights curves beautifully.', prompt: `The model should create a distinct S-curve with their body by tilting their shoulders in one direction 
and their hips in the opposite direction. The right shoulder should tilt forward while the left hip pushes 
outward and away. This creates a flowing, elegant curve through the entire body. The weight should be placed 
on the back leg (left leg) while the front leg (right leg) can be slightly bent or extended. The arms should 
be positioned to emphasize the curves - one arm might rest on the hip while the other hangs gracefully. The 
chest should be open and lifted. The face should look at the camera with a confident, elegant expression.`, instruction: `The model should create a distinct S-curve with their body by tilting their shoulders in one direction 
and their hips in the opposite direction. The right shoulder should tilt forward while the left hip pushes 
outward and away. This creates a flowing, elegant curve through the entire body. The weight should be placed 
on the back leg (left leg) while the front leg (right leg) can be slightly bent or extended. The arms should 
be positioned to emphasize the curves - one arm might rest on the hip while the other hangs gracefully. The 
chest should be open and lifted. The face should look at the camera with a confident, elegant expression.`, direction: 'Front, 3/4' },
        { id: 'stand-9', name: 'Walking Forward', description: 'Mid-stride toward camera. Natural movement and energy.', prompt: `The model should be captured in a natural walking motion, mid-stride toward the camera. The left leg should 
be forward with the knee bent as if stepping, while the right leg remains back with the heel lifting off the 
ground. Both arms should swing naturally with the walking motion - when the left leg is forward, the right arm 
should swing forward, and vice versa (natural gait opposite arm-leg pairing). The body should lean slightly 
forward into the step, conveying forward momentum. The shoulders should rotate naturally with the walking motion. 
The face should look directly at the camera with a relaxed, natural expression.`, instruction: `The model should be captured in a natural walking motion, mid-stride toward the camera. The left leg should 
be forward with the knee bent as if stepping, while the right leg remains back with the heel lifting off the 
ground. Both arms should swing naturally with the walking motion - when the left leg is forward, the right arm 
should swing forward, and vice versa (natural gait opposite arm-leg pairing). The body should lean slightly 
forward into the step, conveying forward momentum. The shoulders should rotate naturally with the walking motion. 
The face should look directly at the camera with a relaxed, natural expression.`, direction: 'Front' },
        { id: 'stand-10', name: 'Leaning Against Wall', description: 'Relaxed lean against structure. Casual and approachable.', prompt: `The model should stand with their back or side positioned against an invisible wall or surface. The body 
should be relaxed and casual, leaning back at a comfortable angle (approximately 110-120 degrees). One leg 
should be bent with that foot placed higher on the wall (knee can be lifted up), while the other leg remains 
straight on the ground. The shoulders should be relaxed against the wall. One arm can rest against the wall 
or body, while the other arm can hang naturally or be positioned casually. The head can tilt back slightly 
or remain upright, with a relaxed, confident expression.`, instruction: `The model should stand with their back or side positioned against an invisible wall or surface. The body 
should be relaxed and casual, leaning back at a comfortable angle (approximately 110-120 degrees). One leg 
should be bent with that foot placed higher on the wall (knee can be lifted up), while the other leg remains 
straight on the ground. The shoulders should be relaxed against the wall. One arm can rest against the wall 
or body, while the other arm can hang naturally or be positioned casually. The head can tilt back slightly 
or remain upright, with a relaxed, confident expression.`, direction: 'Front, 3/4' },
      ]
    },
    sitting: {
      label: '🪑 Sitting Poses',
      poses: [
        { id: 'sit-1', name: 'Crossed Legs Seated', description: 'Legs crossed elegantly, appearing taller and more slender.', prompt: `The model should be seated on an invisible chair or surface with legs elegantly crossed. The right leg should 
cross over the left leg at the thigh, with the right knee bent and positioned over the left thigh. Both feet 
should be positioned toward the ground or the right foot can point gracefully downward. The torso should remain 
upright and vertical with excellent posture - no slouching or leaning back. The back should be straight and 
engaged. The shoulders should be relaxed and level. Both hands can rest gracefully on the thighs or in the lap. 
The face should look directly at the camera with a confident, poised expression.`, instruction: `The model should be seated on an invisible chair or surface with legs elegantly crossed. The right leg should 
cross over the left leg at the thigh, with the right knee bent and positioned over the left thigh. Both feet 
should be positioned toward the ground or the right foot can point gracefully downward. The torso should remain 
upright and vertical with excellent posture - no slouching or leaning back. The back should be straight and 
engaged. The shoulders should be relaxed and level. Both hands can rest gracefully on the thighs or in the lap. 
The face should look directly at the camera with a confident, poised expression.`, direction: 'Front, 3/4' },
        { id: 'sit-2', name: 'Leaning Forward Power', description: 'Leaning forward from waist, elbows on knees. Creates intensity and focus.', prompt: `The model should be seated on an invisible chair or surface, leaning forward from the waist with significant 
intent and presence. The forearms or elbows should rest on the thighs or knees, creating a grounded, focused 
pose. The back should be mostly straight as they lean, not rounded or hunched. The shoulders should be rolled 
back and down, creating an open chest and powerful presence. The head should remain neutral or tilted slightly 
forward to match the lean, with eyes looking directly at the camera with intensity and focus. The legs can be 
positioned with both feet flat on the ground.`, instruction: `The model should be seated on an invisible chair or surface, leaning forward from the waist with significant 
intent and presence. The forearms or elbows should rest on the thighs or knees, creating a grounded, focused 
pose. The back should be mostly straight as they lean, not rounded or hunched. The shoulders should be rolled 
back and down, creating an open chest and powerful presence. The head should remain neutral or tilted slightly 
forward to match the lean, with eyes looking directly at the camera with intensity and focus. The legs can be 
positioned with both feet flat on the ground.`, direction: 'Front' },
        { id: 'sit-3', name: 'Relaxed Floor Sit', description: 'Sitting on floor with legs bent to side or extended. Modern, editorial feel.', prompt: `The model should be seated on the ground in a relaxed, modern position. One leg can be bent and positioned to 
the side (hip bent, knee pointing outward) while the other leg can be bent in front or extended. The model can 
support themselves with one or both hands behind them, or rest their hands on their laps or legs. The shoulders 
should be relaxed and rolled back slightly. The torso should be upright or tilted back very slightly for comfort. 
The head should be upright with a relaxed, natural expression looking toward the camera. The pose should feel 
effortless and natural.`, instruction: `The model should be seated on the ground in a relaxed, modern position. One leg can be bent and positioned to 
the side (hip bent, knee pointing outward) while the other leg can be bent in front or extended. The model can 
support themselves with one or both hands behind them, or rest their hands on their laps or legs. The shoulders 
should be relaxed and rolled back slightly. The torso should be upright or tilted back very slightly for comfort. 
The head should be upright with a relaxed, natural expression looking toward the camera. The pose should feel 
effortless and natural.`, direction: 'Front, 3/4' },
        { id: 'sit-4', name: 'Chair Back Pose', description: 'Straddling chair backward, arms on back. Edgy and powerful.', prompt: `The model should be seated straddling an invisible chair backward, facing the backrest. Both legs should be on 
either side of the chair seat, with feet positioned toward the ground. The model's forearms or hands should rest 
on or grip the back of the chair. The torso should be upright or slightly leaned forward, engaging with the chair 
back. The shoulders should be pulled back, creating an open, confident chest. The head can turn to look directly 
at the camera or tilt to one side. The expression should be edgy, powerful, and confident - conveying attitude 
and edge.`, instruction: `The model should be seated straddling an invisible chair backward, facing the backrest. Both legs should be on 
either side of the chair seat, with feet positioned toward the ground. The model's forearms or hands should rest 
on or grip the back of the chair. The torso should be upright or slightly leaned forward, engaging with the chair 
back. The shoulders should be pulled back, creating an open, confident chest. The head can turn to look directly 
at the camera or tilt to one side. The expression should be edgy, powerful, and confident - conveying attitude 
and edge.`, direction: 'Front, 3/4' },
        { id: 'sit-5', name: 'Side Seated Lean', description: 'Sitting sideways with one leg extended, leaning back on hands. Graceful and flowing.', prompt: `The model should be seated on the ground in profile view (90 degrees to the camera, left side facing camera). The 
model should be leaning back on their hands positioned firmly behind them on the ground. The back leg can be bent 
with the foot near the body, while the front leg can be extended outward gracefully creating a long line. The chest 
should be open and lifted forward, creating a graceful flowing line through the body. The shoulders should be relaxed 
but engaged. The head can tilt back slightly or remain neutral, with a relaxed, confident expression.`, instruction: `The model should be seated on the ground in profile view (90 degrees to the camera, left side facing camera). The 
model should be leaning back on their hands positioned firmly behind them on the ground. The back leg can be bent 
with the foot near the body, while the front leg can be extended outward gracefully creating a long line. The chest 
should be open and lifted forward, creating a graceful flowing line through the body. The shoulders should be relaxed 
but engaged. The head can tilt back slightly or remain neutral, with a relaxed, confident expression.`, direction: 'Profile, 3/4' },
        { id: 'sit-6', name: 'Knees Together Elegant', description: 'Sitting upright with knees together, hands on lap or near face. Classic and refined.', prompt: `The model should be seated upright on an invisible chair or surface with both knees pressed together and both feet 
positioned flat on the ground or elegantly pointed. The legs should form a closed, neat line with the knees touching. 
The torso should be completely upright with perfect posture - spine straight, shoulders back and down, chest open. 
Both hands can rest gracefully on the thighs, in the lap, or one hand on a thigh while the other is positioned near 
the face or shoulder. The expression should be composed, refined, and elegant - looking directly at the camera with 
poise.`, instruction: `The model should be seated upright on an invisible chair or surface with both knees pressed together and both feet 
positioned flat on the ground or elegantly pointed. The legs should form a closed, neat line with the knees touching. 
The torso should be completely upright with perfect posture - spine straight, shoulders back and down, chest open. 
Both hands can rest gracefully on the thighs, in the lap, or one hand on a thigh while the other is positioned near 
the face or shoulder. The expression should be composed, refined, and elegant - looking directly at the camera with 
poise.`, direction: 'Front' },
        { id: 'sit-7', name: 'One Knee Up', description: 'Sitting with one knee raised, other leg extended. Creates interesting angles.', prompt: `The model should be seated on an invisible surface with one leg extended or bent downward while the other leg has 
the knee raised up toward the chest or up toward the shoulder area. The raised knee can rest against the chest or 
be held up by the model's hand or arm. The torso can lean back slightly to accommodate the raised leg, or remain 
mostly upright depending on how high the knee is raised. The arms can wrap around the raised leg, rest on it, or 
hang naturally. The shoulder on the side of the raised leg can roll back to create an open chest. The expression 
should be relaxed and natural.`, instruction: `The model should be seated on an invisible surface with one leg extended or bent downward while the other leg has 
the knee raised up toward the chest or up toward the shoulder area. The raised knee can rest against the chest or 
be held up by the model's hand or arm. The torso can lean back slightly to accommodate the raised leg, or remain 
mostly upright depending on how high the knee is raised. The arms can wrap around the raised leg, rest on it, or 
hang naturally. The shoulder on the side of the raised leg can roll back to create an open chest. The expression 
should be relaxed and natural.`, direction: 'Front, 3/4' },
        { id: 'sit-8', name: 'Hands Behind Lean Back', description: 'Leaning back on hands behind torso. Relaxed and playful.', prompt: `The model should be seated on an invisible surface and lean back significantly, supporting their weight on both 
hands positioned firmly behind the torso, palms flat on the ground. Both legs should be extended in front with feet 
positioned naturally or with feet together or crossed at the ankles. The chest should be completely open and lifted, 
creating a visible, confident presentation. The shoulders should be rolled back and down despite supporting the lean. 
The head can tilt back slightly or remain level, with an engaged, relaxed expression. The body should form a gentle 
curve from the extended legs through the torso to the head.`, instruction: `The model should be seated on an invisible surface and lean back significantly, supporting their weight on both 
hands positioned firmly behind the torso, palms flat on the ground. Both legs should be extended in front with feet 
positioned naturally or with feet together or crossed at the ankles. The chest should be completely open and lifted, 
creating a visible, confident presentation. The shoulders should be rolled back and down despite supporting the lean. 
The head can tilt back slightly or remain level, with an engaged, relaxed expression. The body should form a gentle 
curve from the extended legs through the torso to the head.`, direction: 'Front' },
      ]
    },
    fullBody: {
      label: '🏃 Full Body',
      poses: [
        { id: 'full-1', name: 'Runway Strut', description: 'Walking toward camera with exaggerated stride. Powerful and commanding.', prompt: `The model should be captured walking directly toward the camera down an invisible runway with a powerful, exaggerated 
stride. The gait should be deliberate and commanding - longer steps than a normal walk, with clear weight transfer 
from back leg to front leg. The front leg should be bent at the knee with the foot forward, while the back leg remains 
extended with the heel lifting off the ground. The arms should swing in exaggerated fashion - when the left leg is 
forward, the right arm swings forward, and vice versa. The shoulders should rotate with the stride for dramatic effect. 
The chest should be lifted and open, shoulders back. The head should look directly at the camera with a confident, 
commanding expression.`, instruction: `The model should be captured walking directly toward the camera down an invisible runway with a powerful, exaggerated 
stride. The gait should be deliberate and commanding - longer steps than a normal walk, with clear weight transfer 
from back leg to front leg. The front leg should be bent at the knee with the foot forward, while the back leg remains 
extended with the heel lifting off the ground. The arms should swing in exaggerated fashion - when the left leg is 
forward, the right arm swings forward, and vice versa. The shoulders should rotate with the stride for dramatic effect. 
The chest should be lifted and open, shoulders back. The head should look directly at the camera with a confident, 
commanding expression.`, direction: 'Front' },
        { id: 'full-2', name: 'Mid-Jump Dynamic', description: 'Captured mid-jump or mid-leap. Shows energy and athleticism.', prompt: `The model should be captured in mid-jump, with both feet off the ground and body suspended in the air. Both legs can 
be bent with knees raised up toward the chest or one leg can be extended up while the other is bent. The arms should 
be positioned dynamically - both raised up, one up and one down, or positioned for balance. The torso should be upright 
or slightly tilted depending on the leg positioning. The face should show energy and joy - smiling or expressing 
enthusiasm, looking directly at the camera or tilted up slightly. The entire body should appear weightless and energetic. 
Hair and garment should flow and move with the jump.

DYNAMIC MOTION & CONNECTION REQUIREMENTS:
- All limbs must remain visibly connected to the torso, even during dynamic motion. Pay close attention to the shoulder and hip joints.
- The body should not appear to be floating aimlessly; it must be captured in a clear moment of physical action (jumping, spinning).
- Hair and loose clothing must show natural motion consistent with the action, demonstrating an interaction with gravity and momentum.`, instruction: `The model should be captured in mid-jump, with both feet off the ground and body suspended in the air. Both legs can 
be bent with knees raised up toward the chest or one leg can be extended up while the other is bent. The arms should 
be positioned dynamically - both raised up, one up and one down, or positioned for balance. The torso should be upright 
or slightly tilted depending on the leg positioning. The face should show energy and joy - smiling or expressing 
enthusiasm, looking directly at the camera or tilted up slightly. The entire body should appear weightless and energetic. 
Hair and garment should flow and move with the jump.

DYNAMIC MOTION & CONNECTION REQUIREMENTS:
- All limbs must remain visibly connected to the torso, even during dynamic motion. Pay close attention to the shoulder and hip joints.
- The body should not appear to be floating aimlessly; it must be captured in a clear moment of physical action (jumping, spinning).
- Hair and loose clothing must show natural motion consistent with the action, demonstrating an interaction with gravity and momentum.`, direction: 'Front, Profile' },
        { id: 'full-3', name: 'Walking Away Turn Back', description: 'Walking away from camera, turning head back over shoulder. Elegant and editorial.', prompt: `The model should be captured walking away from the camera down an invisible pathway, but with the head and upper torso 
turned back to look over the shoulder toward the camera. The lower body from the waist down should continue facing away, 
showing the back of the garment fully. The legs should be in mid-stride with a natural walking gait. One leg should be 
forward and one leg back, creating motion. The arms should swing naturally with the walking stride. The upper body should 
twist at the waist to allow the head to turn back and look over the shoulder. The expression should be calm, inviting, 
or intriguing.

SPINE & TORSO TWIST REQUIREMENTS:
- The twist must originate from the waist and upper torso. The hips and lower body should remain facing mostly away from the camera.
- The head and shoulders must not rotate more than a natural 120-150 degrees. The model should be looking over their shoulder, not directly behind them.
- Ensure the shoulders and hips maintain a realistic rotational relationship; they cannot twist independently beyond natural human limits.`, instruction: `The model should be captured walking away from the camera down an invisible pathway, but with the head and upper torso 
turned back to look over the shoulder toward the camera. The lower body from the waist down should continue facing away, 
showing the back of the garment fully. The legs should be in mid-stride with a natural walking gait. One leg should be 
forward and one leg back, creating motion. The arms should swing naturally with the walking stride. The upper body should 
twist at the waist to allow the head to turn back and look over the shoulder. The expression should be calm, inviting, 
or intriguing.

SPINE & TORSO TWIST REQUIREMENTS:
- The twist must originate from the waist and upper torso. The hips and lower body should remain facing mostly away from the camera.
- The head and shoulders must not rotate more than a natural 120-150 degrees. The model should be looking over their shoulder, not directly behind them.
- Ensure the shoulders and hips maintain a realistic rotational relationship; they cannot twist independently beyond natural human limits.`, direction: 'Back, Over-shoulder' },
        { id: 'full-4', name: 'Arch Back Extension', description: 'Arching back with extended limbs. Dramatic and graceful.', prompt: `The model should be standing with the upper back and torso arched backward in an extended, dramatic pose. The arch 
should originate from the mid-back, not the lower back, to maintain elegance and safety. The arms should be raised and 
extended - either both arms overhead and back, or one arm overhead and one arm back, creating graceful extended lines. 
The legs should remain planted firmly on the ground with straight or slightly bent knees. The chest should be lifted and 
open, with the face looking upward or toward the camera depending on the arch. The expression should be serene, graceful, 
or dramatic.

SPINE & TORSO SPECIFIC REQUIREMENTS:
- The back arch must originate from the mid and upper back, not an extreme bend in the lower back.
- The spine must maintain a natural S-curve, even while arched. Do not create a "V" shape bend.
- The waist must not pinch or collapse unnaturally; the torso muscles should appear engaged to support the arch.
- The rib cage must remain properly positioned under the shoulders.`, instruction: `The model should be standing with the upper back and torso arched backward in an extended, dramatic pose. The arch 
should originate from the mid-back, not the lower back, to maintain elegance and safety. The arms should be raised and 
extended - either both arms overhead and back, or one arm overhead and one arm back, creating graceful extended lines. 
The legs should remain planted firmly on the ground with straight or slightly bent knees. The chest should be lifted and 
open, with the face looking upward or toward the camera depending on the arch. The expression should be serene, graceful, 
or dramatic.

SPINE & TORSO SPECIFIC REQUIREMENTS:
- The back arch must originate from the mid and upper back, not an extreme bend in the lower back.
- The spine must maintain a natural S-curve, even while arched. Do not create a "V" shape bend.
- The waist must not pinch or collapse unnaturally; the torso muscles should appear engaged to support the arch.
- The rib cage must remain properly positioned under the shoulders.`, direction: 'Front, Profile' },
        { id: 'full-5', name: 'Walking Feet Aligned', description: 'Walking with feet in line, slight exaggeration. Natural runway-style walk.', prompt: `The model should be captured walking toward the camera with feet positioned in an almost perfectly aligned line - as if 
walking on a tightrope. Each foot should be placed almost directly in front of the other in a narrow line rather than the 
wider natural stance. This is a classic runway walk technique that creates an elegant, controlled appearance. The front leg 
should be bent with the foot forward, the back leg extended with the heel lifting. The arms should swing naturally with the 
walk. The shoulders should remain relatively level and relaxed. The torso should remain upright and stable. The face should 
look directly at the camera with a relaxed, confident expression.`, instruction: `The model should be captured walking toward the camera with feet positioned in an almost perfectly aligned line - as if 
walking on a tightrope. Each foot should be placed almost directly in front of the other in a narrow line rather than the 
wider natural stance. This is a classic runway walk technique that creates an elegant, controlled appearance. The front leg 
should be bent with the foot forward, the back leg extended with the heel lifting. The arms should swing naturally with the 
walk. The shoulders should remain relatively level and relaxed. The torso should remain upright and stable. The face should 
look directly at the camera with a relaxed, confident expression.`, direction: 'Front, Back' },
        { id: 'full-6', name: 'Running Motion', description: 'Running gait captured in motion. Active and energetic.', prompt: `The model should be captured in an active running motion with dynamic energy and speed. Both legs should be in motion - one 
leg bent with the knee raised high up toward the chest, while the other leg is extended back with the heel off the ground. 
The arms should swing powerfully in opposition to the legs - when the left leg is forward, the right arm swings forward and 
the left arm swings back. The torso should lean slightly forward into the run, conveying forward momentum and energy. The 
shoulders should be loose and natural, rotating with the running motion. The face should show energy - looking forward or 
toward the camera with an engaged expression.`, instruction: `The model should be captured in an active running motion with dynamic energy and speed. Both legs should be in motion - one 
leg bent with the knee raised high up toward the chest, while the other leg is extended back with the heel off the ground. 
The arms should swing powerfully in opposition to the legs - when the left leg is forward, the right arm swings forward and 
the left arm swings back. The torso should lean slightly forward into the run, conveying forward momentum and energy. The 
shoulders should be loose and natural, rotating with the running motion. The face should show energy - looking forward or 
toward the camera with an engaged expression.`, direction: 'Front, Profile' },
        { id: 'full-7', name: 'Twirling Spin', description: 'Captured mid-spin or twirl. Dress flows beautifully, full of movement.', prompt: `The model should be captured in a mid-twirl or mid-spin motion, with the body rotating around a central axis. The legs can 
be relatively straight with feet positioned at different points of the rotation, or one leg can be extended up while the other 
is bent. The arms should be extended outward or upward, creating flowing lines that extend beyond the body. The torso should 
be upright with the rotation happening at the center of the body. The face should show joy, freedom, or playfulness. The hair 
should flow and move with the spin. The entire pose should appear caught in motion - mid-action rather than static. The fabric 
should show clear movement and fluidity.

DYNAMIC MOTION & CONNECTION REQUIREMENTS:
- All limbs must remain visibly connected to the torso, even during dynamic motion. Pay close attention to the shoulder and hip joints.
- The body should not appear to be floating aimlessly; it must be captured in a clear moment of physical action (jumping, spinning).
- Hair and loose clothing must show natural motion consistent with the action, demonstrating an interaction with gravity and momentum.`, instruction: `The model should be captured in a mid-twirl or mid-spin motion, with the body rotating around a central axis. The legs can 
be relatively straight with feet positioned at different points of the rotation, or one leg can be extended up while the other 
is bent. The arms should be extended outward or upward, creating flowing lines that extend beyond the body. The torso should 
be upright with the rotation happening at the center of the body. The face should show joy, freedom, or playfulness. The hair 
should flow and move with the spin. The entire pose should appear caught in motion - mid-action rather than static. The fabric 
should show clear movement and fluidity.

DYNAMIC MOTION & CONNECTION REQUIREMENTS:
- All limbs must remain visibly connected to the torso, even during dynamic motion. Pay close attention to the shoulder and hip joints.
- The body should not appear to be floating aimlessly; it must be captured in a clear moment of physical action (jumping, spinning).
- Hair and loose clothing must show natural motion consistent with the action, demonstrating an interaction with gravity and momentum.`, direction: 'Front, Top-down' },
        { id: 'full-8', name: 'Reaching Forward', description: 'Arm extended toward camera, hand reaching out. Creates depth and engagement.', prompt: `The model should stand with one or both arms extended forward toward the camera, creating a reaching, engaging gesture. If 
reaching with one arm, that arm should extend fully toward the camera with the palm open. The other arm can rest at the side 
or be positioned to balance. If reaching with both arms, both should extend forward with palms open. The torso should lean 
slightly forward to enhance the reaching motion. The body should face the camera frontally or at a slight angle. The face should 
look directly at the camera with an engaged, inviting, or playful expression. The legs should be relatively stable with feet 
planted firmly.`, instruction: `The model should stand with one or both arms extended forward toward the camera, creating a reaching, engaging gesture. If 
reaching with one arm, that arm should extend fully toward the camera with the palm open. The other arm can rest at the side 
or be positioned to balance. If reaching with both arms, both should extend forward with palms open. The torso should lean 
slightly forward to enhance the reaching motion. The body should face the camera frontally or at a slight angle. The face should 
look directly at the camera with an engaged, inviting, or playful expression. The legs should be relatively stable with feet 
planted firmly.`, direction: 'Front' },
      ]
    },
    upperBody: {
      label: '👕 Upper Body',
      poses: [
        { id: 'upper-1', name: 'Hand on Collarbone', description: 'Elegant hand placement on collarbone. Draws focus to face and neck.', prompt: `The model should be standing or seated with one hand positioned gracefully on or near the collarbone or shoulder area. The 
hand should appear gentle and elegant, not gripping or tense. The fingers should be relaxed and positioned naturally on the 
collarbone, shoulder, or neck area. The other arm can hang naturally at the side or rest on the lap if seated. The shoulders 
should be relaxed and slightly pulled back to expose the collarbone and neck area. The torso should be upright with good posture. 
The face should look directly at the camera with a calm, composed, elegant expression.`, instruction: `The model should be standing or seated with one hand positioned gracefully on or near the collarbone or shoulder area. The 
hand should appear gentle and elegant, not gripping or tense. The fingers should be relaxed and positioned naturally on the 
collarbone, shoulder, or neck area. The other arm can hang naturally at the side or rest on the lap if seated. The shoulders 
should be relaxed and slightly pulled back to expose the collarbone and neck area. The torso should be upright with good posture. 
The face should look directly at the camera with a calm, composed, elegant expression.`, direction: 'Front, 3/4' },
        { id: 'upper-2', name: 'Hand Through Hair', description: 'Running hand through hair, fingers in hair. Adds movement and allure.', prompt: `The model should have one hand positioned with fingers running through the hair, tousling it gently. The hand should be positioned 
at approximately the crown or side of the head, with fingers visible within the hair creating texture and movement. The arm should be 
bent with the elbow raised outward, creating an open, relaxed posture. The other arm can hang naturally or rest on the body. The 
shoulders should be relaxed and rolled back slightly. The head can tilt slightly toward or away from the hand, showing the neck 
beautifully. The face should display a relaxed, natural expression looking toward the camera.`, instruction: `The model should have one hand positioned with fingers running through the hair, tousling it gently. The hand should be positioned 
at approximately the crown or side of the head, with fingers visible within the hair creating texture and movement. The arm should be 
bent with the elbow raised outward, creating an open, relaxed posture. The other arm can hang naturally or rest on the body. The 
shoulders should be relaxed and rolled back slightly. The head can tilt slightly toward or away from the hand, showing the neck 
beautifully. The face should display a relaxed, natural expression looking toward the camera.`, direction: 'Front, 3/4, Profile' },
        { id: 'upper-3', name: 'Shoulder & Head Tilt', description: 'One shoulder tilted toward camera, head tilted opposite way. Classic beauty shot.', prompt: `The model should position their body with one shoulder tilted or raised toward the camera while tilting their head in the opposite 
direction, away from the raised shoulder. For example, the right shoulder is lifted/tilted forward while the head tilts to the left 
and down. This creates a classic, flattering beauty shot that shows the face beautifully at an angle. The shoulders should not be 
tensed but rather positioned naturally creating an asymmetrical, interesting angle. Both arms should hang naturally or one arm can 
rest on the body. The face should look directly at the camera with a calm, confident expression.`, instruction: `The model should position their body with one shoulder tilted or raised toward the camera while tilting their head in the opposite 
direction, away from the raised shoulder. For example, the right shoulder is lifted/tilted forward while the head tilts to the left 
and down. This creates a classic, flattering beauty shot that shows the face beautifully at an angle. The shoulders should not be 
tensed but rather positioned naturally creating an asymmetrical, interesting angle. Both arms should hang naturally or one arm can 
rest on the body. The face should look directly at the camera with a calm, confident expression.`, direction: '3/4, Front' },
        { id: 'upper-4', name: 'Arms Crossed Casual', description: 'Arms crossed on chest in relaxed way. Cool and composed.', prompt: `The model should stand or sit with both arms crossed casually on the chest or torso. One arm should rest over the other arm creating 
a comfortable, closed posture. The arms should not appear defensive or tense but rather relaxed and comfortable. The hands should rest 
gently on the opposite arm or torso. The shoulders should be relaxed and slightly rolled back, maintaining an open chest despite the 
crossed arms. The posture should be upright with good spine alignment. The face should display a confident, cool, composed expression 
looking directly at the camera.`, instruction: `The model should stand or sit with both arms crossed casually on the chest or torso. One arm should rest over the other arm creating 
a comfortable, closed posture. The arms should not appear defensive or tense but rather relaxed and comfortable. The hands should rest 
gently on the opposite arm or torso. The shoulders should be relaxed and slightly rolled back, maintaining an open chest despite the 
crossed arms. The posture should be upright with good spine alignment. The face should display a confident, cool, composed expression 
looking directly at the camera.`, direction: 'Front' },
        { id: 'upper-5', name: 'Cinched Waist Hands', description: 'Both hands on waist highlighting body. Emphasizes silhouette.', prompt: `The model should stand or sit with both hands positioned on the waist, cinching inward. Both hands should rest on the hips or waist 
area with fingers positioned naturally, creating a frame around the waist and torso. The hands should gently define and emphasize the 
body's natural curves and silhouette. The shoulders should be rolled back and down, creating an open chest. The posture should be 
completely upright with excellent spine alignment. The face should look directly at the camera with a confident expression. The elbows 
should bend naturally creating triangular open space on either side of the body.`, instruction: `The model should stand or sit with both hands positioned on the waist, cinching inward. Both hands should rest on the hips or waist 
area with fingers positioned naturally, creating a frame around the waist and torso. The hands should gently define and emphasize the 
body's natural curves and silhouette. The shoulders should be rolled back and down, creating an open chest. The posture should be 
completely upright with excellent spine alignment. The face should look directly at the camera with a confident expression. The elbows 
should bend naturally creating triangular open space on either side of the body.`, direction: 'Front, 3/4' },
        { id: 'upper-6', name: 'One Hand on Hip Back', description: 'One hand on hip behind back. Subtle movement and confidence.', prompt: `The model should stand with one hand positioned on the hip or waist, with that hand positioned behind or at the back of the hip area. 
The arm should be bent with the elbow pointing outward slightly. The other arm should hang naturally at the side or be positioned subtly. 
The shoulders should be relaxed and level. The torso should be upright with the hand positioning creating subtle definition and interest. 
The face should look directly at the camera with a calm, confident expression. The head can tilt slightly for added elegance. The hand 
positioning should appear natural and unstudied.`, instruction: `The model should stand with one hand positioned on the hip or waist, with that hand positioned behind or at the back of the hip area. 
The arm should be bent with the elbow pointing outward slightly. The other arm should hang naturally at the side or be positioned subtly. 
The shoulders should be relaxed and level. The torso should be upright with the hand positioning creating subtle definition and interest. 
The face should look directly at the camera with a calm, confident expression. The head can tilt slightly for added elegance. The hand 
positioning should appear natural and unstudied.`, direction: 'Front, 3/4' },
        { id: 'upper-7', name: 'Shoulder Pop', description: 'Popping one shoulder forward. Creates dynamic angles.', prompt: `The model should stand with one shoulder (right shoulder) popped forward or raised slightly higher than the other shoulder, creating a 
dynamic asymmetrical line through the shoulders. This should be achieved by leaning weight slightly to one side or tilting the upper body. 
The face should remain looking directly at the camera. Both arms should hang naturally at the sides or one arm can be positioned to enhance 
the shoulder pop. The torso should remain mostly upright. The head can remain level or tilt slightly to complement the shoulder position. 
The expression should be confident and engaging.`, instruction: `The model should stand with one shoulder (right shoulder) popped forward or raised slightly higher than the other shoulder, creating a 
dynamic asymmetrical line through the shoulders. This should be achieved by leaning weight slightly to one side or tilting the upper body. 
The face should remain looking directly at the camera. Both arms should hang naturally at the sides or one arm can be positioned to enhance 
the shoulder pop. The torso should remain mostly upright. The head can remain level or tilt slightly to complement the shoulder position. 
The expression should be confident and engaging.`, direction: 'Front' },
        { id: 'upper-8', name: 'Arm Behind Head', description: 'Arm raised behind head showing underarm and torso. Elongates body.', prompt: `The model should stand or sit with one arm raised behind the head with the hand and forearm positioned behind or on top of the head and 
neck. The elbow should point outward creating an open line. This positioning shows the underarm, side torso, and creates an elongated body 
line. The other arm can hang naturally at the side or rest on the torso or lap. The shoulders should be relaxed and rolled back, maintaining 
an open chest despite the raised arm. The face should look directly at the camera with a relaxed, confident expression. The head can tilt 
slightly toward or away from the raised arm.`, instruction: `The model should stand or sit with one arm raised behind the head with the hand and forearm positioned behind or on top of the head and 
neck. The elbow should point outward creating an open line. This positioning shows the underarm, side torso, and creates an elongated body 
line. The other arm can hang naturally at the side or rest on the torso or lap. The shoulders should be relaxed and rolled back, maintaining 
an open chest despite the raised arm. The face should look directly at the camera with a relaxed, confident expression. The head can tilt 
slightly toward or away from the raised arm.`, direction: 'Front, 3/4, Profile' },
      ]
    },
    lowerBody: {
      label: '👗 Lower Body',
      poses: [
        { id: 'lower-1', name: 'Legs Wide Stance', description: 'Legs spread wide apart. Shows off pants and creates confident look.', prompt: `The model should stand with legs positioned significantly wider than shoulder-width apart, creating an intentionally wide, powerful 
stance. Both feet should be planted firmly and securely on the ground. The weight should be evenly distributed or shifted slightly forward. 
The upper body should remain upright and face the camera directly. The arms can hang naturally at the sides, be positioned on the hips, or 
be used to frame the legs. The shoulders should remain level and relaxed. The face should look directly at the camera with a confident 
expression. This wide stance is perfect for showcasing pants and creating a strong, confident appearance.

WEIGHT & STABILITY REQUIREMENTS:
- Both feet must be planted solidly and flatly on the ground to support the wide stance.
- The model's center of gravity must remain visibly centered between the feet, ensuring the pose looks stable and not like they are falling.
- The legs must connect properly at the hips, showing engaged muscles (like inner thighs) to support the wide positioning.`, instruction: `The model should stand with legs positioned significantly wider than shoulder-width apart, creating an intentionally wide, powerful 
stance. Both feet should be planted firmly and securely on the ground. The weight should be evenly distributed or shifted slightly forward. 
The upper body should remain upright and face the camera directly. The arms can hang naturally at the sides, be positioned on the hips, or 
be used to frame the legs. The shoulders should remain level and relaxed. The face should look directly at the camera with a confident 
expression. This wide stance is perfect for showcasing pants and creating a strong, confident appearance.

WEIGHT & STABILITY REQUIREMENTS:
- Both feet must be planted solidly and flatly on the ground to support the wide stance.
- The model's center of gravity must remain visibly centered between the feet, ensuring the pose looks stable and not like they are falling.
- The legs must connect properly at the hips, showing engaged muscles (like inner thighs) to support the wide positioning.`, direction: 'Front' },
        { id: 'lower-2', name: 'Feet Pointed Elegance', description: 'One leg extended with pointed toe. Ballet-like elegance.', prompt: `The model should be standing or in a dynamic pose with one leg extended and the foot pointed gracefully, similar to a ballet position. 
The pointed foot should be fully extended with toes pointed and elongated. The other leg can be bent or supporting the body weight. The 
body should be facing toward or at an angle to the camera showing both the extended leg and the foot position beautifully. The arms can 
be positioned elegantly to complement the leg extension. The torso should be upright and elegant. The face should display a calm, graceful 
expression. This pose elongates the legs and creates an elegant, ballet-inspired aesthetic.`, instruction: `The model should be standing or in a dynamic pose with one leg extended and the foot pointed gracefully, similar to a ballet position. 
The pointed foot should be fully extended with toes pointed and elongated. The other leg can be bent or supporting the body weight. The 
body should be facing toward or at an angle to the camera showing both the extended leg and the foot position beautifully. The arms can 
be positioned elegantly to complement the leg extension. The torso should be upright and elegant. The face should display a calm, graceful 
expression. This pose elongates the legs and creates an elegant, ballet-inspired aesthetic.`, direction: 'Front, Profile, 3/4' },
        { id: 'lower-3', name: 'Leaning on One Leg', description: 'All weight on one leg, other leg bent or extended. Creates hip angles.', prompt: `The model should stand with all their weight placed on one leg (right leg) while the other leg (left leg) is bent, relaxed, or extended. 
The standing leg should appear completely responsible for supporting the body weight. The bent leg can rest with the foot off the ground, 
be crossed, or be extended outward. The hips should shift noticeably to accommodate the weight distribution, creating an asymmetrical stance. 
The upper body should lean slightly toward the weighted leg or opposite to create visual interest. The arms can hang naturally or be positioned 
for balance. The face should look directly at the camera with a relaxed, confident expression.`, instruction: `The model should stand with all their weight placed on one leg (right leg) while the other leg (left leg) is bent, relaxed, or extended. 
The standing leg should appear completely responsible for supporting the body weight. The bent leg can rest with the foot off the ground, 
be crossed, or be extended outward. The hips should shift noticeably to accommodate the weight distribution, creating an asymmetrical stance. 
The upper body should lean slightly toward the weighted leg or opposite to create visual interest. The arms can hang naturally or be positioned 
for balance. The face should look directly at the camera with a relaxed, confident expression.`, direction: 'Front, 3/4, Profile' },
        { id: 'lower-4', name: 'Knee Lifted Dynamic', description: 'One knee lifted up high. Athletic and energetic.', prompt: `The model should stand with one knee lifted up high toward the chest or waist area, creating dynamic, athletic positioning. The lifted 
knee can be held by the hands or arms, or can be positioned freely. The other leg should remain standing straight and planted firmly on 
the ground supporting the body weight. The upper body should lean back slightly to accommodate the lifted knee and maintain balance. The 
arms can wrap around the raised leg or hang at the sides. The shoulders should remain relaxed and level. The face should display an energetic, 
confident expression looking toward the camera.`, instruction: `The model should stand with one knee lifted up high toward the chest or waist area, creating dynamic, athletic positioning. The lifted 
knee can be held by the hands or arms, or can be positioned freely. The other leg should remain standing straight and planted firmly on 
the ground supporting the body weight. The upper body should lean back slightly to accommodate the lifted knee and maintain balance. The 
arms can wrap around the raised leg or hang at the sides. The shoulders should remain relaxed and level. The face should display an energetic, 
confident expression looking toward the camera.`, direction: 'Front, Profile' },
        { id: 'lower-5', name: 'Feet Crossed Standing', description: 'Feet crossed at ankles while standing. Elegant and refined.', prompt: `The model should stand with feet positioned close together and crossed at the ankles, creating a neat, elegant, refined stance. One foot 
should be positioned in front of the other with ankles crossed naturally. Both feet should be visible. The weight should be evenly distributed 
or slightly favoring one leg. The upper body should be upright and face the camera directly. The arms can hang naturally at the sides or be 
positioned gracefully. The shoulders should be relaxed and level. The face should look directly at the camera with a poised, elegant expression.`, instruction: `The model should stand with feet positioned close together and crossed at the ankles, creating a neat, elegant, refined stance. One foot 
should be positioned in front of the other with ankles crossed naturally. Both feet should be visible. The weight should be evenly distributed 
or slightly favoring one leg. The upper body should be upright and face the camera directly. The arms can hang naturally at the sides or be 
positioned gracefully. The shoulders should be relaxed and level. The face should look directly at the camera with a poised, elegant expression.`, direction: 'Front' },
        { id: 'lower-6', name: 'Stepping Forward Step', description: 'Front leg stepped forward, back leg straight. Shows leg shape.', prompt: `The model should be captured in a stepping motion with the front leg (right leg) stepped forward with the foot positioned in front of the 
body and the knee slightly bent. The back leg (left leg) should be extended behind with the heel off the ground. The body weight should 
shift forward showing clear lunge or stepping motion. The upper body should lean slightly forward into the step. The arms can swing naturally 
or be positioned for balance. The shoulders should rotate slightly with the stepping motion. The face should look toward or past the camera 
suggesting forward movement.`, instruction: `The model should be captured in a stepping motion with the front leg (right leg) stepped forward with the foot positioned in front of the 
body and the knee slightly bent. The back leg (left leg) should be extended behind with the heel off the ground. The body weight should 
shift forward showing clear lunge or stepping motion. The upper body should lean slightly forward into the step. The arms can swing naturally 
or be positioned for balance. The shoulders should rotate slightly with the stepping motion. The face should look toward or past the camera 
suggesting forward movement.`, direction: 'Front, Profile' },
        { id: 'lower-7', name: 'Sitting Leg Extension', description: 'Sitting with legs extended long. Shows off footwear and leg shape.', prompt: `The model should be seated on an invisible chair or surface with both legs extended in front, creating a long leg line. The legs can be 
together or crossed at the ankles. The feet can be pointed or flexed. The upper body should be upright or leaned back slightly for comfort. 
The arms can rest in the lap or be positioned gracefully. The shoulders should be relaxed. The face should look directly at the camera with 
a calm expression. The entire leg line from hip to toe should be visible and elongated, showing off leg shape beautifully.`, instruction: `The model should be seated on an invisible chair or surface with both legs extended in front, creating a long leg line. The legs can be 
together or crossed at the ankles. The feet can be pointed or flexed. The upper body should be upright or leaned back slightly for comfort. 
The arms can rest in the lap or be positioned gracefully. The shoulders should be relaxed. The face should look directly at the camera with 
a calm expression. The entire leg line from hip to toe should be visible and elongated, showing off leg shape beautifully.`, direction: 'Front, 3/4' },
        { id: 'lower-8', name: 'Pigeon-Toe Playful', description: 'Feet turned inward playfully. Creates cute casual vibe.', prompt: `The model should stand with feet pointed inward playfully, creating a pigeon-toed stance. Both feet should be angled inward toward each 
other rather than pointing forward. The knees can be slightly bent or straight. The weight should be evenly distributed. The upper body should 
be upright with a relaxed posture. The arms can hang naturally at the sides or be positioned playfully. The shoulders should remain relaxed 
and level. The face should display a playful, cute, or approachable expression looking directly at the camera. The overall impression should 
be cute, casual, and friendly.`, instruction: `The model should stand with feet pointed inward playfully, creating a pigeon-toed stance. Both feet should be angled inward toward each 
other rather than pointing forward. The knees can be slightly bent or straight. The weight should be evenly distributed. The upper body should 
be upright with a relaxed posture. The arms can hang naturally at the sides or be positioned playfully. The shoulders should remain relaxed 
and level. The face should display a playful, cute, or approachable expression looking directly at the camera. The overall impression should 
be cute, casual, and friendly.`, direction: 'Front' },
      ]
    },
    profile: {
      label: '👤 Profile Views',
      poses: [
        { id: 'prof-1', name: 'Perfect Profile', description: 'Complete 90-degree profile. Clean and professional.', prompt: `The model should stand in a complete side profile view, with their body turned exactly 90 degrees to the camera. The left side of the body 
should face the camera. Both feet should be firmly planted on the ground with natural, graceful posture. The head should also remain in 
profile, facing directly left. The chin should be slightly lifted, and the jawline should be clearly visible and defined. The shoulders 
should be relaxed but not slouched. Both arms should hang naturally at the sides or be positioned elegantly. The torso should be upright 
with excellent posture. The entire profile view should be clean and unobstructed.`, instruction: `The model should stand in a complete side profile view, with their body turned exactly 90 degrees to the camera. The left side of the body 
should face the camera. Both feet should be firmly planted on the ground with natural, graceful posture. The head should also remain in 
profile, facing directly left. The chin should be slightly lifted, and the jawline should be clearly visible and defined. The shoulders 
should be relaxed but not slouched. Both arms should hang naturally at the sides or be positioned elegantly. The torso should be upright 
with excellent posture. The entire profile view should be clean and unobstructed.`, direction: 'Profile' },
        { id: 'prof-2', name: 'Profile with Arm Up', description: 'Side view with arm raised. Elongates entire side line.', prompt: `The model should stand in a complete profile view with their body turned 90 degrees to the camera. The left side of the body should face 
the camera. One arm (right arm) should be raised overhead or extended upward and back, creating an elongated line through the entire side 
of the body. The other arm (left arm) can hang naturally at the side or be positioned back. The legs should remain planted with good posture. 
The head should remain in profile looking forward. The raised arm should elongate and open the entire side body line beautifully. The torso 
should maintain excellent posture throughout.`, instruction: `The model should stand in a complete profile view with their body turned 90 degrees to the camera. The left side of the body should face 
the camera. One arm (right arm) should be raised overhead or extended upward and back, creating an elongated line through the entire side 
of the body. The other arm (left arm) can hang naturally at the side or be positioned back. The legs should remain planted with good posture. 
The head should remain in profile looking forward. The raised arm should elongate and open the entire side body line beautifully. The torso 
should maintain excellent posture throughout.`, direction: 'Profile' },
        { id: 'prof-3', name: 'Profile Head Tilt Back', description: 'Profile with head tilted back. Shows neck and jawline beautifully.', prompt: `The model should stand in a complete profile view with their body turned exactly 90 degrees to the camera. The left side of the body should 
face the camera. The head should be tilted back gracefully, with the chin lifted upward and the neck extended. The jawline should be clearly 
visible and defined. The face should remain in profile showing the full side profile of the face. Both arms should hang naturally at the 
sides or be positioned elegantly. The shoulders should be relaxed and level. The chest should be open and lifted. The entire profile 
including the tilted head and extended neck should be clearly visible.`, instruction: `The model should stand in a complete profile view with their body turned exactly 90 degrees to the camera. The left side of the body should 
face the camera. The head should be tilted back gracefully, with the chin lifted upward and the neck extended. The jawline should be clearly 
visible and defined. The face should remain in profile showing the full side profile of the face. Both arms should hang naturally at the 
sides or be positioned elegantly. The shoulders should be relaxed and level. The chest should be open and lifted. The entire profile 
including the tilted head and extended neck should be clearly visible.`, direction: 'Profile' },
        { id: 'prof-4', name: 'Sitting Profile', description: 'Seated in pure profile. Great for showing garment drape.', prompt: `The model should be seated on an invisible chair or surface in a pure profile view, with their body turned exactly 90 degrees to the camera. 
The left side of the body should face the camera. The torso should be upright with good posture. Both feet should be flat on the ground. 
The arms can be positioned naturally - one arm on the lap, one arm resting on a thigh, or both hands resting in the lap. The head should 
remain in profile looking forward. The face should display a calm, composed expression. The seated position should show how the garment drapes 
and sits when seated in profile view. The overall impression should be refined and elegant.`, instruction: `The model should be seated on an invisible chair or surface in a pure profile view, with their body turned exactly 90 degrees to the camera. 
The left side of the body should face the camera. The torso should be upright with good posture. Both feet should be flat on the ground. 
The arms can be positioned naturally - one arm on the lap, one arm resting on a thigh, or both hands resting in the lap. The head should 
remain in profile looking forward. The face should display a calm, composed expression. The seated position should show how the garment drapes 
and sits when seated in profile view. The overall impression should be refined and elegant.`, direction: 'Profile' },
        { id: 'prof-5', name: 'Profile Lean Back', description: 'Profile view leaning back slightly. Creates elegant back line.', prompt: `The model should stand in a profile view with the left side of the body facing the camera. The upper body should lean back slightly from the 
waist, creating an open chest and elegant back line. The legs should remain relatively straight and planted on the ground providing stability. 
The arms can hang naturally or one arm can be positioned behind the body for support. The shoulders should remain relaxed and slightly back. 
The head can tilt back slightly or remain level. The face should display a calm, elegant expression. The lean-back creates a graceful curve 
through the entire body line.`, instruction: `The model should stand in a profile view with the left side of the body facing the camera. The upper body should lean back slightly from the 
waist, creating an open chest and elegant back line. The legs should remain relatively straight and planted on the ground providing stability. 
The arms can hang naturally or one arm can be positioned behind the body for support. The shoulders should remain relaxed and slightly back. 
The head can tilt back slightly or remain level. The face should display a calm, elegant expression. The lean-back creates a graceful curve 
through the entire body line.`, direction: 'Profile' },
      ]
    },
    back: {
      label: '🔙 Back Views',
      poses: [
        { id: 'back-1', name: 'Perfect Back Standing', description: 'Straight back view with perfect posture. Shows garment back beautifully.', prompt: `The model should stand with their back directly to the camera, feet positioned naturally apart or together. The body should face completely 
away from the camera. The shoulders should be relaxed and level. Both arms should hang naturally at the sides or be positioned with hands 
on hips or along the sides. The posture should be upright with good spine alignment. The head should face forward away from the camera. The 
garment's entire back should be fully and clearly visible. The overall impression should be clean, professional, and show the back of the 
garment beautifully. No leaning or twisting should occur.`, instruction: `The model should stand with their back directly to the camera, feet positioned naturally apart or together. The body should face completely 
away from the camera. The shoulders should be relaxed and level. Both arms should hang naturally at the sides or be positioned with hands 
on hips or along the sides. The posture should be upright with good spine alignment. The head should face forward away from the camera. The 
garment's entire back should be fully and clearly visible. The overall impression should be clean, professional, and show the back of the 
garment beautifully. No leaning or twisting should occur.`, direction: 'Back' },
        { id: 'back-2', name: 'Back Over Shoulder', description: 'Back view with head turned looking over shoulder. Mysterious and elegant.', prompt: `The model should stand with their back fully to the camera, with feet positioned naturally and the entire lower body facing away. The head 
and upper shoulders should turn significantly to look over the shoulder back toward the camera. The twist should originate from the upper 
torso while the lower body remains facing away. The head should turn approximately 120-150 degrees to make eye contact with the camera over 
the shoulder. The expression should be mysterious, calm, or intriguing. The garment's back should be fully visible while the face is partially 
visible over the shoulder. This creates an editorial, sophisticated look.

SPINE & TORSO TWIST REQUIREMENTS:
- The twist must originate from the waist and upper torso. The hips and lower body should remain facing mostly away from the camera.
- The head and shoulders must not rotate more than a natural 120-150 degrees. The model should be looking over their shoulder, not directly behind them.
- Ensure the shoulders and hips maintain a realistic rotational relationship; they cannot twist independently beyond natural human limits.`, instruction: `The model should stand with their back fully to the camera, with feet positioned naturally and the entire lower body facing away. The head 
and upper shoulders should turn significantly to look over the shoulder back toward the camera. The twist should originate from the upper 
torso while the lower body remains facing away. The head should turn approximately 120-150 degrees to make eye contact with the camera over 
the shoulder. The expression should be mysterious, calm, or intriguing. The garment's back should be fully visible while the face is partially 
visible over the shoulder. This creates an editorial, sophisticated look.

SPINE & TORSO TWIST REQUIREMENTS:
- The twist must originate from the waist and upper torso. The hips and lower body should remain facing mostly away from the camera.
- The head and shoulders must not rotate more than a natural 120-150 degrees. The model should be looking over their shoulder, not directly behind them.
- Ensure the shoulders and hips maintain a realistic rotational relationship; they cannot twist independently beyond natural human limits.`, direction: 'Back, Over-shoulder' },
        { id: 'back-3', name: 'Back with Arms Up', description: 'Back view with arms raised. Shows back and arm positioning beautifully.', prompt: `The model should stand with their back to the camera, with the entire lower body facing away and body completely upright. Both arms should 
be raised overhead or extended upward, showing the entire arm length and creating an open, powerful line. The arms can be positioned together 
or slightly apart. The shoulders should remain relaxed despite the raised arms. The head should remain facing forward away from the camera 
or tilt back slightly. The back of the garment should be completely visible including how it looks with arms raised. This pose is perfect 
for showing backless or open-back designs.`, instruction: `The model should stand with their back to the camera, with the entire lower body facing away and body completely upright. Both arms should 
be raised overhead or extended upward, showing the entire arm length and creating an open, powerful line. The arms can be positioned together 
or slightly apart. The shoulders should remain relaxed despite the raised arms. The head should remain facing forward away from the camera 
or tilt back slightly. The back of the garment should be completely visible including how it looks with arms raised. This pose is perfect 
for showing backless or open-back designs.`, direction: 'Back' },
        { id: 'back-4', name: 'Back Walking Away', description: 'Walking away from camera. Shows garment from behind while in motion.', prompt: `The model should be captured walking away from the camera in a natural walking motion. Both legs should be in mid-stride with natural, 
confident walking gait. One leg should be forward stepping and one leg back. The arms should swing naturally with the walking motion in 
opposition to the legs. The shoulders should rotate naturally with the walking motion. The head should remain facing forward in the direction 
of travel. The entire back of the garment should be visible as the model walks away. The walking motion should appear natural, confident, 
and show how the garment moves.`, instruction: `The model should be captured walking away from the camera in a natural walking motion. Both legs should be in mid-stride with natural, 
confident walking gait. One leg should be forward stepping and one leg back. The arms should swing naturally with the walking motion in 
opposition to the legs. The shoulders should rotate naturally with the walking motion. The head should remain facing forward in the direction 
of travel. The entire back of the garment should be visible as the model walks away. The walking motion should appear natural, confident, 
and show how the garment moves.`, direction: 'Back' },
        { id: 'back-5', name: 'Back Hands Behind Head', description: 'Back view with hands behind head. Shows back of dress beautifully.', prompt: `The model should stand with their back to the camera, body facing completely away. Both hands should be positioned behind the head with 
fingers interlaced or relaxed behind the neck or head area. The elbows should point outward creating an open line. The shoulders should be 
relaxed and level. The posture should be upright. The head should remain facing away from the camera. The back of the garment should be 
fully visible from the shoulders down. This relaxed pose is perfect for casual wear and shows the back garment beautifully in a comfortable, 
approachable position.`, instruction: `The model should stand with their back to the camera, body facing completely away. Both hands should be positioned behind the head with 
fingers interlaced or relaxed behind the neck or head area. The elbows should point outward creating an open line. The shoulders should be 
relaxed and level. The posture should be upright. The head should remain facing away from the camera. The back of the garment should be 
fully visible from the shoulders down. This relaxed pose is perfect for casual wear and shows the back garment beautifully in a comfortable, 
approachable position.`, direction: 'Back' },
      ]
    }
};

const poseImageMap: { [key: string]: string } = {
    // Standing
    'stand-1': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-stand-1.jpg',
    'stand-2': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-stand-2.jpg',
    'stand-3': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-stand-3.jpg',
    'stand-4': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-stand-4.jpg',
    'stand-5': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-stand-5.jpg',
    'stand-6': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-stand-6.jpg',
    'stand-7': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-stand-7.jpg',
    'stand-8': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-stand-8.jpg',
    'stand-9': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-stand-9.jpg',
    'stand-10': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-stand-10.jpg',
    // Sitting
    'sit-1': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-sit-1.jpg',
    'sit-2': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-sit-2.jpg',
    'sit-3': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-sit-3.jpg',
    'sit-4': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-sit-4.jpg',
    'sit-5': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-sit-5.jpg',
    'sit-6': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-sit-6.jpg',
    'sit-7': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-sit-7.jpg',
    'sit-8': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-sit-8.jpg',
    // Full Body
    'full-1': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-full-1.jpg',
    'full-2': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-full-2.jpg',
    'full-3': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-full-3.jpg',
    'full-4': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-full-4.jpg',
    'full-5': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-full-5.jpg',
    'full-6': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-full-6.jpg',
    'full-7': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-full-7.jpg',
    'full-8': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-full-8.jpg',
    // Upper Body
    'upper-1': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-upper-1.jpg',
    'upper-2': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-upper-2.jpg',
    'upper-3': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-upper-3.jpg',
    'upper-4': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-upper-4.jpg',
    'upper-5': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-upper-5.jpg',
    'upper-6': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-upper-6.jpg',
    'upper-7': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-upper-7.jpg',
    'upper-8': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-upper-8.jpg',
    // Lower Body
    'lower-1': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-lower-1.jpg',
    'lower-2': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-lower-2.jpg',
    'lower-3': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-lower-3.jpg',
    'lower-4': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-lower-4.jpg',
    'lower-5': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-lower-5.jpg',
    'lower-6': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-lower-6.jpg',
    'lower-7': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-lower-7.jpg',
    'lower-8': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-lower-8.jpg',
    // Profile
    'prof-1': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-prof-1.jpg',
    'prof-2': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-prof-2.jpg',
    'prof-3': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-prof-3.jpg',
    'prof-4': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-prof-4.jpg',
    'prof-5': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-prof-5.jpg',
    // Back
    'back-1': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-back-1.jpg',
    'back-2': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-back-2.jpg',
    'back-3': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-back-3.jpg',
    'back-4': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-back-4.jpg',
    'back-5': 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-back-5.jpg',
};


export const poseLibrary = Object.entries(posesData).reduce((acc, [key, value]) => {
    acc[key] = {
        ...value,
        poses: value.poses.map(pose => ({
            ...pose,
            previewImageUrl: poseImageMap[pose.id] || 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-stand-1.jpg'
        }))
    };
    return acc;
}, {} as { [key: string]: { label: string, poses: PosePreset[] } });

export const twoModelPoseLibrary: TwoModelPosePreset[] = [
    {
        id: 'tm-stroll-1',
        name: 'Side-by-Side Stroll',
        description: 'Two models walking together, interacting naturally.',
        model1Instruction: 'Walking on the left side of the frame, mid-stride, looking ahead with a relaxed expression.',
        model2Instruction: 'Walking on the right side of the frame, mid-stride, turning slightly to look at Model 1 and smiling.',
        previewImageUrl: 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-full-1.jpg'
    },
    {
        id: 'tm-backtoback-1',
        name: 'Back to Back',
        description: 'A confident, powerful pose showing both models back-to-back.',
        model1Instruction: 'Standing back-to-back with Model 2, arms crossed, looking confidently at the camera.',
        model2Instruction: 'Standing back-to-back with Model 1, hands in pockets, looking off to the side with a serious expression.',
        previewImageUrl: 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-stand-1.jpg'
    },
    {
        id: 'tm-lean-1',
        name: 'Shoulder Lean',
        description: 'A relaxed and intimate pose where one model leans on the other.',
        model1Instruction: 'Standing straight and relaxed, looking at the camera with a soft smile, allowing Model 2 to lean on their shoulder.',
        model2Instruction: 'Leaning their head gently on Model 1\'s right shoulder, looking at the camera with a warm, happy expression.',
        previewImageUrl: 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-stand-2.jpg'
    },
    {
        id: 'tm-laughing-1',
        name: 'Laughing Together',
        description: 'A candid, joyful moment of two models laughing.',
        model1Instruction: 'Looking at Model 2, captured mid-laugh with an open, joyful expression.',
        model2Instruction: 'Also looking at Model 1, smiling widely as if sharing a joke.',
        previewImageUrl: 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-full-2.jpg'
    },
    {
        id: 'tm-whisper-1',
        name: 'Sharing a Secret',
        description: 'An intimate and intriguing pose where one model whispers to the other.',
        model1Instruction: 'Leaning in close to Model 2\'s ear, as if whispering a secret. Face is mostly obscured.',
        model2Instruction: 'Listening to Model 1, with a slight, knowing smile on their face, looking towards the camera.',
        previewImageUrl: 'https://storage.googleapis.com/gemini-95-icons/pose-previews/pose-preview-upper-3.jpg'
    }
];