using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace CampusSurvival
{
    public sealed class VnUiMotion : MonoBehaviour, IPointerEnterHandler, IPointerExitHandler, IPointerDownHandler, IPointerUpHandler
    {
        public bool reducedMotion;
        RectTransform rect;
        CanvasGroup group;
        Image surface;
        Text label;
        Vector2 target, offset;
        Color normal, hover;
        float start, duration=.25f, from=1, to=1;
        bool pointer, pressed, remove, entry;
        public void ButtonStyle(Image image,Text text,Color baseColor,Color hoverColor)
        { surface=image;label=text;normal=baseColor;hover=hoverColor;rect=(RectTransform)transform; }
        public void Enter(float delay,float seconds,Vector2 displacement,bool reduced)
        {
            rect=(RectTransform)transform;group=GetComponent<CanvasGroup>()??gameObject.AddComponent<CanvasGroup>();
            target=rect.anchoredPosition;offset=displacement;duration=seconds;start=Time.unscaledTime+delay;from=0;to=1;remove=false;
            entry=Application.isPlaying&&!reduced;group.alpha=entry?0:1;group.blocksRaycasts=!entry;
            if(entry)rect.anchoredPosition=target+offset;
        }
        public void Leave(float seconds,bool reduced)
        {
            rect=(RectTransform)transform;group=GetComponent<CanvasGroup>()??gameObject.AddComponent<CanvasGroup>();
            target=rect.anchoredPosition;offset=Vector2.zero;duration=seconds;start=Time.unscaledTime;from=group.alpha;to=0;remove=true;entry=true;group.blocksRaycasts=false;
            if(reduced||!Application.isPlaying)Destroy(gameObject);
        }
        void Update()
        {
            if(entry)
            {
                float t=Mathf.Clamp01((Time.unscaledTime-start)/Mathf.Max(.01f,duration));float eased=1-Mathf.Pow(1-t,3);
                group.alpha=Mathf.Lerp(from,to,eased);rect.anchoredPosition=target+offset*(1-eased);group.blocksRaycasts=!remove&&t>.85f;
                if(t>=1){entry=false;if(remove)Destroy(gameObject);}
            }
            if(surface!=null)
            {
                surface.color=Color.Lerp(surface.color,pointer?hover:normal,Time.unscaledDeltaTime*14);
                float scale=reducedMotion ? 1 : pressed ? .99f : pointer ? 1.012f : 1;
                rect.localScale=Vector3.Lerp(rect.localScale,Vector3.one*scale,Time.unscaledDeltaTime*16);
            }
        }
        public void OnPointerEnter(PointerEventData e){pointer=true;}
        public void OnPointerExit(PointerEventData e){pointer=false;pressed=false;}
        public void OnPointerDown(PointerEventData e){pressed=true;}
        public void OnPointerUp(PointerEventData e){pressed=false;}
    }
}
