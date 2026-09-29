import {useEffect,useState} from "react";
import {ActivityIndicator,FlatList,Image,RefreshControl,SafeAreaView,StyleSheet,Text,View} from "react-native";
import {supabase} from "./src/lib/supabase";

type ContentItem={id:string;type:"article"|"product"|"page";title:string;slug:string;excerpt:string|null;image_url:string|null};

export default function App(){
 const[items,setItems]=useState<ContentItem[]>([]),[loading,setLoading]=useState(true),[refreshing,setRefreshing]=useState(false),[error,setError]=useState<string|null>(null);
 async function loadContent(showRefresh=false){
  if(showRefresh)setRefreshing(true);else setLoading(true);
  const{data,error:queryError}=await supabase.from("content_items").select("id,type,title,slug,excerpt,image_url").eq("published",true).order("created_at",{ascending:false});
  if(queryError){setError(queryError.message);}else{setError(null);setItems(data??[]);}
  setLoading(false);setRefreshing(false);
 }
 useEffect(()=>{loadContent();const channel=supabase.channel("content-items-mobile").on("postgres_changes",{event:"*",schema:"public",table:"content_items"},()=>loadContent()).subscribe();return()=>{supabase.removeChannel(channel);};},[]);
 return <SafeAreaView style={styles.safe}><FlatList contentContainerStyle={styles.container} data={items} keyExtractor={item=>item.id} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>loadContent(true)}/>} ListHeaderComponent={<View style={styles.hero}><Text style={styles.badge}>WOW MOBILE</Text><Text style={styles.title}>المحتوى من Supabase مباشرة</Text><Text style={styles.subtitle}>أي محتوى منشور من لوحة Supabase يظهر هنا والموقع يستخدم نفس المصدر.</Text></View>} ListEmptyComponent={loading?<ActivityIndicator size="large"/>:<View style={styles.card}><Text style={styles.empty}>{error||"لا يوجد محتوى منشور بعد."}</Text></View>} renderItem={({item})=><View style={styles.card}>{item.image_url?<Image source={{uri:item.image_url}} style={styles.image}/>:null}<Text style={styles.type}>{item.type}</Text><Text style={styles.cardTitle}>{item.title}</Text>{item.excerpt?<Text style={styles.excerpt}>{item.excerpt}</Text>:null}</View>}/></SafeAreaView>;
}
const styles=StyleSheet.create({
 safe:{flex:1,backgroundColor:"#07111f"},container:{padding:20,gap:14},hero:{paddingVertical:28},badge:{color:"#60a5fa",fontWeight:"800",letterSpacing:1},title:{color:"#f8fafc",fontSize:28,fontWeight:"800",marginTop:10},subtitle:{color:"#cbd5e1",fontSize:16,lineHeight:26,marginTop:10},card:{backgroundColor:"#111d2f",borderRadius:18,padding:16,borderWidth:1,borderColor:"#26364d"},image:{width:"100%",height:190,borderRadius:12,marginBottom:12},type:{color:"#60a5fa",fontSize:12,fontWeight:"700"},cardTitle:{color:"#fff",fontSize:20,fontWeight:"700",marginTop:6},excerpt:{color:"#cbd5e1",lineHeight:24,marginTop:8},empty:{color:"#cbd5e1",lineHeight:24}
});