import {useEffect,useState} from "react";
import {ActivityIndicator,FlatList,Image,Pressable,RefreshControl,SafeAreaView,StyleSheet,Text,View} from "react-native";
import {supabase} from "./src/lib/supabase";

type ContentItem={id:string;type:"article"|"product"|"page";title:string;slug:string;excerpt:string|null;body:string|null;image_url:string|null};

export default function App(){
 const[items,setItems]=useState<ContentItem[]>([]),[selected,setSelected]=useState<ContentItem|null>(null),[loading,setLoading]=useState(true),[refreshing,setRefreshing]=useState(false),[error,setError]=useState<string|null>(null);

 async function loadContent(showRefresh=false){
  if(showRefresh)setRefreshing(true);else setLoading(true);
  const{data,error:queryError}=await supabase.from("content_items").select("id,type,title,slug,excerpt,body,image_url").eq("published",true).order("created_at",{ascending:false});
  if(queryError)setError(queryError.message);else{setError(null);setItems(data??[]);}
  setLoading(false);setRefreshing(false);
 }

 useEffect(()=>{loadContent();const channel=supabase.channel("content-items-mobile").on("postgres_changes",{event:"*",schema:"public",table:"content_items"},()=>loadContent()).subscribe();return()=>{supabase.removeChannel(channel);};},[]);

 if(selected) return <SafeAreaView style={styles.safe}><FlatList contentContainerStyle={styles.container} data={[]} ListHeaderComponent={<View><Pressable onPress={()=>setSelected(null)}><Text style={styles.back}>← العودة للمحتوى</Text></Pressable><View style={styles.detailCard}>{selected.image_url?<Image source={{uri:selected.image_url}} style={styles.image}/>:null}<Text style={styles.type}>{selected.type}</Text><Text style={styles.detailTitle}>{selected.title}</Text>{selected.excerpt?<Text style={styles.excerpt}>{selected.excerpt}</Text>:null}<View style={styles.body}>{(selected.body||"").split(/\n+/).filter(Boolean).map((paragraph,index)=><Text key={index} style={styles.bodyText}>{paragraph}</Text>)}</View></View></View>} /></SafeAreaView>;

 return <SafeAreaView style={styles.safe}><FlatList contentContainerStyle={styles.container} data={items} keyExtractor={item=>item.id} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>loadContent(true)}/>} ListHeaderComponent={<View style={styles.hero}><Text style={styles.badge}>WOW MOBILE</Text><Text style={styles.title}>المحتوى من Supabase مباشرة</Text><Text style={styles.subtitle}>المحتوى المنشور من لوحة التحكم يظهر هنا وفي الموقع، مع تحديث مباشر.</Text></View>} ListEmptyComponent={loading?<ActivityIndicator size="large"/>:<View style={styles.card}><Text style={styles.empty}>{error||"لا يوجد محتوى منشور بعد."}</Text></View>} renderItem={({item})=><Pressable style={styles.card} onPress={()=>setSelected(item)}>{item.image_url?<Image source={{uri:item.image_url}} style={styles.image}/>:null}<Text style={styles.type}>{item.type}</Text><Text style={styles.cardTitle}>{item.title}</Text>{item.excerpt?<Text style={styles.excerpt}>{item.excerpt}</Text>:null}<Text style={styles.read}>قراءة المزيد ←</Text></Pressable>}/></SafeAreaView>;
}

const styles=StyleSheet.create({
 safe:{flex:1,backgroundColor:"#07111f"},container:{padding:20,gap:14},hero:{paddingVertical:28},badge:{color:"#60a5fa",fontWeight:"800",letterSpacing:1},title:{color:"#f8fafc",fontSize:28,fontWeight:"800",marginTop:10},subtitle:{color:"#cbd5e1",fontSize:16,lineHeight:26,marginTop:10},card:{backgroundColor:"#111d2f",borderRadius:18,padding:16,borderWidth:1,borderColor:"#26364d"},detailCard:{backgroundColor:"#111d2f",borderRadius:18,padding:18,borderWidth:1,borderColor:"#26364d",marginTop:16},image:{width:"100%",height:190,borderRadius:12,marginBottom:12},type:{color:"#60a5fa",fontSize:12,fontWeight:"700"},cardTitle:{color:"#fff",fontSize:20,fontWeight:"700",marginTop:6},detailTitle:{color:"#fff",fontSize:28,fontWeight:"800",marginTop:8,lineHeight:36},excerpt:{color:"#cbd5e1",lineHeight:24,marginTop:8},body:{marginTop:18},bodyText:{color:"#e2e8f0",fontSize:16,lineHeight:28,marginBottom:14},read:{color:"#60a5fa",fontWeight:"800",marginTop:12},back:{color:"#60a5fa",fontWeight:"800",fontSize:16,paddingVertical:8},empty:{color:"#cbd5e1",lineHeight:24}
});