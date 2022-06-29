# iEDA-RT软件设计说明书

**编制：** iEDA布线组

**审核：** iEDA 课题组

**时间：**

---

## 版本修改历史

| 版本号 | 日期       | 作者 | 简要说明 |
| ------ | ---------- | ---- | -------- |
| 0.10   | 202x-xx-xx |      |          |
|        |            |      |          |
|        |            |      |          |
|        |            |      |          |
|        |            |      |          |

---

# 1. 简介

**背景**

![布线在物理设计中的位置](https://images.gitee.com/uploads/images/2022/0527/122207_1dccbcf1_1004707.png "0897178917f3748302ec655a8174aa9.png")
布线是继布局和时钟树综合之后的重要物理实施任务，其内容是将分布在芯片核内的模块，标准单元和输入输出接口单元按逻辑关系进行互连，并为满足各种约束条件进行优化。iRT是iEDA 课题组针对布线阶段设计的一款布线器，其内部集成了全局布线和详细布线。

**编写目的**

本文挡将主要介绍iRT工具内部各个模块的作用，数据结构，主要程序流程以及模块间的调用关系。

**目标读者**

使用iRT的用户（标题2之前），iRT的开发者（标题2及之后）。

## 1.1 设计需求和目标

**需求**

在所有线网都连通的情况下，生成没有DRC，LVS等规则违例的布线结果。

**目标**

* 没有连通的线网个数为0
* DRC违例个数为0
* 满足时序约束
* 总线长最短
* 总通孔数最少

## 1.2 使用说明

### 1.2.1 运行环境设置

运行iRT需要文件POWV.dat，POST.dat，slute.txt，请将这些文件与iRT的可执行文件放到同一目录下。

### 1.2.1 配置文件设置

iRT的默认配置文件为irt_default_config.json，需要对里面的路径进行设置才能使用。内部分为总体设置（flow，lef，def等输入输出文件路径）和模块设置（GridManager，ResourceAllocator等内部模块），下面将描述这些字段的作用以及如何进行配置。

* 总体设置

```json
{
    "RT": {
        "flow": [ //iRT集成了GR和DR，可以在flow里控制单独运行GR，单独运行DR或GR-DR集成运行
            "GR",
            "DR"
        ],
        "lef_file_list": [ //lef文件路径，由于iDB的读取机制，tech_lef必须要在第一个
            "<tech_lef_file_path>",
            "<lef_file_path1>",
            "<lef_file_path2>"
        ],
        "def_file": "<def_file_path>", //输入def文件路径
        "guide_file": "<guide_file_path>", //GR输出guide文件路径或DR输入guide文件路径
        "output_def_file": "<output_def_file_path>",//DR输出def文件路径
        "temp_directory": "<temp_directory_path>", //临时文件夹路径，主要用于存储运行时临时数据
  
        .............."模块设置"..............

    }
}
```

* 模块设置
  
  - GridManager
  
  ```json
  "GridManager": {
            "global_utilization_ratio": 1, //全局利用率
            "layer_utilization_ratio": { //单层利用率
                "METAL1": 0
            },
            "temp_directory": "<temp_directory_path>" //临时文件夹路径
        },
  ```
  
  - ResourceAllocator
  
  ```json
  "ResourceAllocator": {
            "number_of_frame_levels": 1, //多层框架级数（暂不可用）
            "initial_penalty_para": 100, //梯度下降算法的初始罚参数
            "penalty_para_drop_rate": 0.8, //梯度下降算法的下降率
            "max_outer_iter_num": 10, //梯度下降算法的外层最大迭代次数
            "max_inner_iter_num": 50, //梯度下降算法的内层最大迭代次数
            "temp_directory": "<temp_directory_path>" //临时文件夹路径
        },
  ```
  
  - PlaneRouter
  
  ```json
  "PlaneRouter": {
            "single_enlarge_range": 10, //扩区域布线的单次扩大范围，，GCell为单位
            "max_enlarge_times": 10, //扩区域布线的最大扩大次数
            "max_lut_capicity": 99999, //最大查找表能力（暂不可用）
            "resource_weight": 3, //资源权值权重
            "congestion_weight": 1, //拥塞权值权重
            "temp_directory": "<temp_directory_path>" //临时文件夹路径
        },
  ```
  
  - LayerAssigner
  
  ```json
  "LayerAssigner": {
            "max_segment_length": 1, //单次移动的最大线段长度，GCell为单位
            "via_weight": 1, //通孔权值权重
            "congestion_weight": 1, //拥塞权值权重
            "temp_directory": "<temp_directory_path>" //临时文件夹路径
        },
  ```
  
  - TrackAssigner
  
  ```json
  "TrackAssigner": {
            "adjacent_segment_ratio": 0.1, //同线网权重
            "connect_pin_ratio": 1, //同线网Pin的权重
            "pin_obs_ratio": 0.5, //其他线网Pin权重
            "pa_cost": 0.5, //同线网AP点权重
            "overlap_ratio": 100, //重叠权重
            "drc_ratio": 10000, //DRC权重
            "temp_directory": "<temp_directory_path>" //临时文件夹路径
        },
  ```
  
  - RegionRouter
  
  ```json
  "RegionRouter": {
            "routing_size": 1,//绕线基本Gcell单位
            "gcell_size": 6560,//Gcell大小
            "grid_cost": 1,//cost_map中格点cost值
            "around_cost": 50,//cost_map中某点扩散的cost值
            "via_cost": 20,//cost_map中打下Via的cost值
            "drc_cost": 100,//cost_map中发生DRC的cost值
            "temp_directory": "<temp_directory_path>" //临时文件夹路径
        },
  ```
  
  - SpaceRouter
  
  ```json
  "SpaceRouter": {
            "routing_size": 1,//绕线基本Gcell单位
            "gcell_size": 6150,//Gcell大小
            "temp_directory": "<temp_directory_path>" //临时文件夹路径
        },
  ```
  
  - ExternalInteractor
  
  ```json
  "ExternalInteractor": {
            "sta_workspace": "<sta_workspace_path>", //iSTA的工作路径
            "sdc_file": "<sdc_file_path>", //sdc的文件路径
            "lib_file_list": [ //时序lib的文件路径
                "<lib_file_path1>", 
                "<lib_file_path2>",
                "<lib_file_path3>"
            ],
            "temp_directory": "<temp_directory_path>" //临时文件夹路径
        }
  ```
* 程序运行：编译iRT后将产生可执行文件run_rt，需要通过以下方式启动。

```shell
run_rt <irt_config_path>
```

## 1.3 参考文档

### 1.3.1 全局布线

[1][GR拆解文档](https://ieda.yuque.com/kzqyb5/tga6ng/8274755)
[2]FastRoute: An efficient and high-quality global router
[3]CUGR: Detailed-routability-driven 3D global routing with probabilistic resource model.
[4]FLUTE: Fast lookup table based rectilinear steiner minimal tree algorithm for VLSI design

### 1.3.2 详细布线

[1][DR开发文档](https://ieda.yuque.com/kzqyb5/no8a7o/sdxppp)
[2]Negotiation-Based Track Assignment Considering Local Nets
[3]TritonRoute-WXL: The Open-Source Router With Integrated DRC Engine
[4]TritonRoute: The Open-Source Detailed Router
[5]Dr. CU: Detailed Routing by Sparse Grid Graph and Minimum-Area-Captured Path Search

- **专有名词**

| **名词（缩写）**         | **定义（中文名，解释或包含的属性，作用）**       |
| ------------------------------ | ------------------------------------------------------ |
| Global Routing (GR)            | 全局布线                                               |
| Detail Routing (DR)            | 详细布线                                               |
| Pin Access (PA)                | PinAccess模块名，也可指代AP点                          |
| Access Point (AP)              | Pin上的可接入点，包含x-y坐标，一般作为布线的起点或终点 |
| Region Ripup & Rerouting (RRR) | 区域拆线重布                                           |

# 2. 整体设计

## 2.1 总体架构

![iRT架构图](https://images.gitee.com/uploads/images/2022/0527/192811_c63fc6ab_1004707.png "iRouter架构.png")

* irt_config.json：iRT配置文件
* iDB：顶层数据来源
* data_manager：iRT的数据管理模块，主要管理Database和Config
* Config：Config类，用于存储iRT配置（包括子模块配置）
* Database：用于存储iRT需要的所有数据（包括但不限于Die，Layer，Net等）
* ExternalInteractor：外部接口类，用于iRT与外部工具交互
* OP：算子库，存储算法（如A*，ILP等）
* Utility：公共库，存储日志工具，工具类，测试类等
* interface：与外部交互的工具

- **全局布线模块**
  * GridManager：网格管理器，用于管理被GCell划分的网格
  * ResourceAllocator：资源分配器，用于在布线前给线网分配资源
  * PlaneRouter：平面绕线器，用于生成线网的二维布线结果
  * LayerAssigner：层分配器，将二维布线结果分配到三维
- **详细布线模块**
  * PinAccessor：pin接入器，在pin上找到详细布线可以接入的点
  * GuideProcessor：guide处理器，用于处理全局布线结果guide
  * RegionManager：区域管理器，用于存储绕线层以上的所有金属
  * TrackAssignment：对Net的区域生成Seg，并且对每条seg分配track，要求避障，最小化重
  * RegionRouter：从第二层开始每两层进行绕线，获得绕线初始解
  * SpaceRouter：对指定区域中的线网或者指定线网进行空间绕线获得最终解

## 2.2 总体流程

![输入图片说明](https://images.gitee.com/uploads/images/2022/0528/123721_8a9e3a02_1004707.png "LDPC.png")

* init()：用于初始化iRT的Config，Database和各个子模块。

```cpp=
void RT::init(std::string& rt_config_path, PCL::iDB::IdbBuilder* idb_builder)
{
  double start, end;
  start = COMUtil::microtime();

  printLogo();
  _data_manager.input(rt_config_path, idb_builder);

  Config* config = &_data_manager.getConfig();
  Database* database = &_data_manager.getDatabase();

  GridManager::getInst(config, database);
  TopoGenerator::getInst(config, database);
  ResourceAllocator::getInst(config, database);
  PlaneRouter::getInst(config, database);
  LayerAssigner::getInst(config, database);
  ExternalInteractor::getInst(config, database);
  PinAccessor::getInst(config, database);
  GuideProcessor::getInst(config, database);
  TrackAssigner::getInst(config, database);

  end = COMUtil::microtime();
  Logger::info("RT", "Total initialization time: ", (end - start), "s");
}
```

* run()：iRT的主要流程，里面多个模块在作用，模块的输入为iRT顶层数据，输出通常是Net数据结构内的某个数据。

```cpp=
void RT::run()
{
  double start, end;
  start = COMUtil::microtime();

  Config* config = &_data_manager.getConfig();
  Database* database = &_data_manager.getDatabase();
  std::vector<Net>& net_list = _data_manager.getDatabase().get_net_list();

  ResourceAllocator::getInst().allocate(net_list);
  PrioritySorter::getInst().sort(SortType::kBBoxHPWL, net_list);

  irt_int batch_size = COMUtil::getBatchSize(net_list.size());

  for (size_t i = 0; i < net_list.size(); i++) {
    Net& net = net_list[i];
    PlaneRouter::getInst().route(net);
    LayerAssigner::getInst().assign(net);
    if ((i + 1) % batch_size == 0) {
      GridManager::getInst().checkResourceMap();
      Logger::info("RT", "Processed ", (i + 1), " nets");
    }
  }

  GridManager::getInst().checkResourceMap();
  Logger::info("RT", "Processed ", net_list.size(), " nets(total)");

  GridManager::getInst().printPlaneResourceMap();
  GridManager::getInst().printSpaceResourceMap();
  GridManager::getInst().reportResourceMap();

  _data_manager.outputGuide();
  // sort net_idx
  sortNetIdx(net_list);
  // ExternalInteractor::getInst().reportTiming(_data_manager.getAuxInfo().get_idb_builder(), net_list);

  ExternalInteractor::getInst().initPAPoint(_data_manager.getAuxInfo().get_idb_builder());

  PinAccessor::getInst().access(net_list);
  PinAccessor& pin_accessor = PinAccessor::getInst();
  pin_accessor.access(net_list);
  PinAccessor::delInst();
  // Guide
  GuideProcessor::getInst().processorGuide(net_list);
  GuideProcessor::delInst();
  // TA
  AssignTrackType ta_type = AssignTrackType::kGreddy;
#ifdef BUILD_GUROBI
  ta_type = AssignTrackType::kILP;
#endif
  TrackAssigner::getInst().assignTrack(net_list, ta_type);
  TrackAssigner::delInst();
  // _data_manager.output(NetProcessStage::kTrackAssigner);
  // RR
  // _drc = _db_wrapper->get_drc();

  // _data_manager.output(NetProcessStage::kTrackAssigner);
  // RR
  // _drc = _db_wrapper->get_drc();

  ExternalInteractor::getInst().initDRC(_data_manager.getAuxInfo().get_idb_builder());
  // ExternalInteractor::getInst().checkDRC({1, 2}, region, dr_node_list);
  RegionRouter& region_router = RegionRouter::getInst(config, database);
  region_router.debugWriteGdsForNet();
  region_router.topoBuilder();
  region_router.areaRouter();
  _data_manager.outputDef(NetProcessStage::kRegionRouter);

  end = COMUtil::microtime();
  Logger::info("RT", "Total run time: ", (end - start), "s");
}
```

* destroy()：用于销毁模块和iRT，防止内存泄露。

```cpp=
void RT::destroy()
{
  RegionManager::delInst();
  GridManager::delInst();
  TopoGenerator::delInst();
  ResourceAllocator::delInst();
  PlaneRouter::delInst();
  LayerAssigner::delInst();
  GuideProcessor::delInst();
  TrackAssigner::delInst();
  RegionRouter::delInst();
  SpaceRouter::delInst();
  ExternalInteractor::delInst();
}
```

## 2.3 数据结构设计

### 2.3.1 Coordinate.hpp

平面坐标，模板类。

```cpp=
T _x = -1;
  T _y = -1;
```

### 2.3.2 Direction.hpp

二维方向，用于标识线的方向，有以下三种状态(横，竖，斜)。
![输入图片说明](https://images.gitee.com/uploads/images/2022/0528/194923_dcb9c760_1004707.png "b405c3fd35a0201e7765ea59dda6565.png")

```cpp=
kNone = 0,
  kHorizontal = 1,
  kVertical = 2,
  kOblique = 3
```

### 2.3.3 GridMap.hpp

网格图，模板类，可自定义网格内存放的数据，其中坐标轴如下所示，原点在左下角。
![输入图片说明](https://images.gitee.com/uploads/images/2022/0528/194411_d08dfb67_1004707.png "3.png")

```cpp=
void init(irt_int x_size, irt_int y_size); // 初始化GridMap
  void init(irt_int x_size, irt_int y_size, T value); // 设定初值后初始化GridMap
  void free(); // 释放GridMap
  bool isEmpty() const; // GridMap是否为空
  bool inScope(irt_int x, irt_int y) const; // 坐标(x,y)是否在GridMap内
  std::vector<typename std::result_of<FUNC(T&&)>::type> forEachGrid(FUNC&& func); // 遍历GridMap
```

### 2.3.4 MTree.hpp

多叉树，模板类，可自定义多叉树节点（TNode.hpp）存放的数据。

```cpp=
// 拷贝一棵树
  static MTree<T> copyTree(MTree<T>& old_tree);
  static TNode<T>* copyTree(TNode<T>* old_root);

  // 释放一棵树
  static void freeTree(MTree<T>& old_tree);
  static void freeTree(TNode<T>* root);

  // 将MTree<T>通过函数"U convert（T）"转换为MTree<U>
  static MTree<U> convertTree(MTree<T>& old_tree, const std::function<U(T&, Args&...)>& convert, Args&... args);
  static TNode<U>* convertTree(TNode<T>* old_root, const std::function<U(T&, Args&...)>& convert, Args&... args);

  // 层序遍历，返回每一层的节点，返回值[0]为根节点
  static std::vector<std::vector<TNode<T>*>> getlevelOrder(MTree<T>& tree, irt_int max_level = -1);
  static std::vector<std::vector<TNode<T>*>> getlevelOrder(TNode<T>* root, irt_int max_level = -1);

  // 查找深度是否超过max_level
  static bool isDeeperThan(MTree<T>& tree, irt_int max_level);
  static bool isDeeperThan(TNode<T>* root, irt_int max_level);

  // 将树分解为多个线段
  static std::vector<Segment<TNode<T>*>> getSegListByTree(MTree<T>& tree);
  static std::vector<Segment<TNode<T>*>> getSegListByTree(TNode<T>* root);
  
// 将多个线段组合成树
  static MTree<T> getTreeBySegList(std::vector<Segment<T>>& segment_list);
  static MTree<T> getTreeBySegList(T& root_value, std::vector<Segment<T>>& segment_list);
```

对于函数getSegListByTree和getTreeBySegList做出补充解释。
`<img src="http://images.gitee.com/uploads/images/2022/0528/204539_de88beff_1004707.png" width="70%">`

### 2.3.5 Orientation.hpp

二维指向，与Direction.hpp不同，指向分为以下四种状态。

![输入图片说明](https://images.gitee.com/uploads/images/2022/0528/205824_7aced12b_1004707.png "Snipaste_2022-05-28_20-58-05.png")

```cpp=
kNone = 0,
  kEast = 1,
  kWest = 2,
  kSouth = 3,
  kNorth = 4
```

### 2.3.6 Rectangle.hpp

描述一个矩形，面向坐标的模板
![输入图片说明](https://images.gitee.com/uploads/images/2022/0528/211828_d628214f_1004707.png "Snipaste_2022-05-28_21-18-10.png")

```cpp=
Coordinate<T> _lb;
  Coordinate<T> _rt;

  T getLength() const; // 获得矩形的长
  T getWidth() const; // 获得矩形的宽
  T getHalfPerimeter() const; // 获得矩形的半周长
  T getPerimeter() const; // 获得矩形的周长
  T getArea() const; // 获得矩形的面积
  std::vector<Segment<Coordinate<T>>> getEdgeList();// 获得矩形的四条边
  Coordinate<T> getMidPoint() const;// 获得矩形的中点
  bool isCoordOnRTEdge(Coordinate<T> coord) const;// 点在矩形的右边或者上边
  bool isCoordOnEdge(Coordinate<T> coord) const;// 点在矩形的边上
```

### 2.3.7 Segment.hpp

描述一个线段，模板类，线段节点为模板

```cpp=
// 以下四个函数只支持当坐标为模板时
struct sortSegmentInnerXASC; // 线段内按X升序排列节点
struct sortSegmentInnerYASC; // 线段内按Y升序排列节点
struct CmpSegmentXASC; // 按每条线段内第一个节点的X升序 线段间排列
struct CmpSegmentYASC; // 按每条线段内第一个节点的Y升序 线段间排列
```

### 2.3.8 TNode.hpp

树节点，模板类，与MTree.hpp一同使用。

```cpp=
T _v;// 当前存储的数据
  std::vector<TNode<T>*> _child_list;// 节点的孩子

  irt_int getBranchNum(); // 查看当前节点分支个数（或者孩子个数）
  bool isLeafNode(); // 当前节点是否为叶子节点
  void addChild(TNode<T>* child); // 为当前节点添加一个孩子
  void addChildren(const std::vector<TNode<T>*>& child_list); // 为当前节点添加多个孩子
  void delChild(TNode<T>* child); // 删除当前节点的一个孩子
  void delChildren(const std::vector<TNode<T>*>& child_list);// 删除当前节点的多个孩子
  void clearChildren(); // 清除当前节点的所有孩子
```

### 2.3.9 Blockage.hpp

在iRT内，Blockage表示为RoutingBlockage，其带有形状（EXTRectangle），层信息以及对应的类型，这里的类型主要从“来源”的角度进行区分。

```cpp=
EXTRectangle _shape; // 二维形状
  irt_int _layer_idx = -1; // 布线层id
  BlockageType _type = BlockageType::kNone; // Blockage来源类型
```

### 2.3.10 BlockageType.hpp

```cpp=
kNone = 0,
  kArtificial = 1, // 在def内描述，由工程师在版图上添加的blockage
  kInstance = 2, // 由于多层instance的结构阻挡了布线层，所以被作为布线blockage
  kSpecialNet = 3 // 高层的电源线，阻挡布线层，被作为布线blockage
```

### 2.3.11 Config.hpp

iRT配置，其中包括对iRT顶层的配置和对各个子模块的配置，配置来源是irt_config.json。

```cpp=
// RT
  std::vector<std::string> _flow; // 流控制，可以控制单跑GR或DR，或者联合run
  std::vector<std::string> _lef_file_path_list; // lef文件路径，由于iDB的读取机制，tech_lef必须要在第一个
  std::string _def_file_path; // 输入def文件路径
  std::string _guide_file_path; // GR输出guide文件路径或DR输入guide文件路径
  std::string _output_def_file_path; // DR输出def文件路径
  std::string _temp_directory_path; // 临时文件夹路径，主要用于存储运行时临时数据
  // RT ExternalInteractor
  EIConfig _ei_config; // ExternalInteractor配置
  // RT GridManager
  GMConfig _gm_config; // GridManager配置
  // RT GuideProcessor
  GPConfig _gp_config; // GuideProcessor配置
  // RT LayerAssigner
  LAConfig _la_config; // LayerAssigner配置
  // RT PinAccessor
  PAConfig _pa_config; // PinAccessor配置
  // RT PlaneRouter
  PRConfig _pr_config; // PlaneRouter配置
  // RT RegionManager
  RMConfig _rm_config; // RegionManager配置
  // RT RegionRouter
  RRConfig _rr_config; // RegionRouter配置
  // RT ResourceAllocator
  RAConfig _ra_config; // ResourceAllocator配置
  // RT SpaceRouter
  SRConfig _sr_config; // SpaceRouter配置
  // RT TopoGenerator
  TGConfig _tg_config; // TopoGenerator配置
  // RT TrackAssigner
  TAConfig _ta_config; // TrackAssigner配置
```

### 2.3.12 CutLayer.hpp

设计中除了RoutingLayer外，还有CutLayer，CutLayer主要用于放置Via。

![输入图片说明](https://images.gitee.com/uploads/images/2022/0528/215828_cdd6b027_1004707.png "Snipaste_2022-05-28_21-57-29.png")

```cpp=
irt_int _layer_idx = -1; // cut层id
  std::string _layer_name; // cut层名字
  std::vector<Spacing> _spacing_list; // 生成通孔的spacing规则
```

### 2.3.13 DRNode.hpp

DetailRouting里面使用的节点（可能为Wire Or Via）

```cpp=
irt_int _net_idx = -1;  //线网下标
  DRNodeType _type = DRNodeType::kNone; // DRNode的类型
  DRNodeCategory _category = DRNodeCategory::kNone; //DRNode是通过何种类别产生的
  WireNode _wire_node;
  ViaNode _via_node;
```

### 2.3.14 DRNodeCategory.hpp

```cpp=
kNone = -1,  
  kTA = 0, //TA阶段产生的线
  kRouting = 1, //后续绕线新增的线
  kForce = 2, //强制绕线
  kMinArea =3 //最小面积补充的线
```

### 2.3.15 DRNodeType.hpp

```cpp=
enum class DRNodeType
{
  kNone = 0,
  kWire = 1,
  kVia = 2
};
```

### 2.3.16 Database.hpp

顶层的数据类，包含所有的模块通用数据

```cpp=
private:
  EXTRectangle _die;        //芯片面积大小
  GCellAxis _gcell_axis;    //GR中 Gcell的划分
  std::vector<Via> _via_lib; //通孔库
  std::vector<RoutingLayer> _routing_layer_list; //绕线层
  std::vector<CutLayer> _cut_layer_list;  //CUT层一般是用于连接金属层的
  std::vector<Blockage> _blockage_list;  //障碍物集合
  std::vector<Net> _net_list;            //线网集合
```

### 2.3.17 EXTRectangle.hpp

![输入图片说明](https://images.gitee.com/uploads/images/2022/0529/102830_0314c529_1004707.png "Snipaste_2022-05-29_10-27-34.png")

```cpp=
private:
  Rectangle<irt_int> _grid; // 缩放的gcell矩形，以gcell为标准基数
  Rectangle<irt_int> _real; // 真实的版图坐标矩形
```

### 2.3.18 Enclosure.hpp

通孔VIA的上下帽子的数据结构，形状包括水平 垂直。

<img src="https://images.gitee.com/uploads/images/2022/0529/170353_3f4e81c7_7702195.png" width="70%">

```cpp=
private:
  Rectangle<irt_int> _shape; //帽子形状
  irt_int _layer_idx = -1; //帽子所在的层id
  Direction _direction = Direction::kNone;
```

### 2.3.19 GCellAxis.hpp

同一维度上的GCellGrid头尾相连即为GCellAxis。

```cpp=
private:
  std::vector<GCellGrid> _x_grid_list; // x轴
  std::vector<GCellGrid> _y_grid_list; // y轴
```

### 2.3.20 GCellGrid.hpp

下图中，第一条语句中的“1100”为_start_line，“2”为（_step_num+1），“50”为_step_length，_end_line = _start_line+（_step_length*_step_num）。
![输入图片说明](https://images.gitee.com/uploads/images/2022/0529/104808_c897e1d0_1004707.png "Snipaste_2022-05-29_10-47-47.png")

```cpp=
private:
  irt_int _start_line = 0;     // 起始位置
  irt_int _step_length = 0;   // 步长
  irt_int _step_num = 0;     // 步数
  irt_int _end_line = 0;    // 结束位置
```

### 2.3.21 GRNode.hpp

GR的结点

```cpp=
private:
  // self
  Coordinate<irt_int> _grid_coord;  //格点坐标
  irt_int _layer_idx = -1; // 布线层id
  // ref
  std::vector<irt_int> _pin_point_idx_list;  //包含那些Pin
```

### 2.3.22 Guide.hpp

![输入图片说明](https://images.gitee.com/uploads/images/2022/0529/114503_622c1812_1004707.png "Snipaste_2022-05-29_11-44-46.png")

1、保存GR计算的结果，作为TrackAssign输入数据
2、在RegionRouter模块，保存已有的布线结果，作为建立rrouter的rtree和设置障碍依据。

```cpp=
irt_int _layer_idx = -1;
Rectangle<irt_int> _real_shape; //真实的形状
```

### 2.3.23 IOType.hpp

引脚的输入输出类型
![输入图片说明](https://images.gitee.com/uploads/images/2022/0529/194132_a877bdc5_7702195.png "屏幕截图.png")

```cpp=
kNone = 0,
kInput = 1,//输入IO
kOutput = 2,//输出IO
kInOut = 3,//输入输出IO
kFeedthru = 4 // 一种理解如上，待确认
```

### 2.3.24 Net.hpp

线网类，保存线网信息，所有的模块的结果会对应地写入这里

```cpp=
irt_int _net_idx = -1; // 线网id
  std::string _net_name; // 线网名字
  SigType _sig_type = SigType::kNone; // 线网信号类型（Signal，Clock等）
  std::vector<Pin> _pin_list; // pin列表
  Pin _driving_pin; // 驱动pin，一个线网只有一个驱动pin
  EXTRectangle _bounding_box; // 线网所有pin的外接矩形
  std::vector<PinPoint> _pin_point_list; // pin对应在RT内的数据结构
  PinPoint _driving_pin_point;// 驱动pin对应在RT内的数据结构
  irt_int _min_layer_cstr = -1; // 这个线网的最低布线层
  // PrioritySorter
  double _priority = 0; // 线网优先级
  // ResourceAllocator
  GridMap<double> _ra_cost_map; // ResourceAllocator的结果，以权值图体现
  // PlaneRouter
  MTree<GRNode> _pr_plane_tree; // PlaneRouter的结果，以多叉树描述
  // LayerAssigner
  MTree<GRNode> _la_space_tree; // LayerAssigner的结果，以多叉树描述
  // GuideProcessor
  std::vector<Guide> _guide_list; // 此线网的Guide集合
  // TrackAssigner
  std::vector<DRNode> _ta_wire_list; // TrackAssigner的结果，已合理分配但零散的wire
  // RegionRouter
  MTree<DRNode> _rr_space_tree; // RegionRouter的结果，以多叉树描述
```

### 2.3.25 NetProcessStage.hpp

描述线网在布线过程中，已经生成NetProcessStage阶段的结果了，可以认为是流程控制。

```cpp=
kNone,
kTrackAssigner,
kRegionRouter,
kRegionRipUpRouter,
kSpaceRouter,
kSpaceRipUpRouter,
kMax
```

### 2.3.26 PAPoint.hpp

Wire连接Pin的连接点

```cpp=
irt_int _layer_idx = -1;            // pa点所在的层信息
Coordinate<irt_int> _real_coord;    // pa点的绝对坐标
PAPointType _type = PAPointType::KNone;        // pa点的类型
std::vector<irt_int> _optional_via_idx_list;   // pa候选via在via_lib中的下标
```

### 2.3.27 PAPointType.hpp

PAPoint的类型

<img src="https://images.gitee.com/uploads/images/2022/0530/185006_3e578fa0_1004707.png" width="45%">

```cpp=
KNone = 0,    // 未初始化类型
kOnGrid = 1,  // pa点在track交点上
kOnTrack = 2, // pa点在pin shape内部track的中间点上
kCenter = 3,  // pa点在pin shape的中心点上
kOffset = 4   // pa点是经过偏移之后的点
```

### 2.3.28 PinPoint.hpp

Pin在RT内的数据结构(下面网格是上下两层track的俯视图)

```cpp=
// self
irt_int _pin_point_idx = -1;      // 当前PinPoint对应的id
Coordinate<irt_int> _real_coord;  // pin点的绝对坐标
Coordinate<irt_int> _grid_coord;  // pin点在grid_map中的相对坐标
std::vector<irt_int> _layer_idx_list;    // pin所跨的层信息
std::vector<PAPoint> _pa_point_list;     // pin上的pa列表
// ref
irt_int _pin_idx = -1;                   //当前PinPoint对应的Pin的id
```

### 2.3.29 Port.hpp

保存pin shape信息，当pin跨多层时，每层的pin shape对应一个Port。
![输入图片说明](https://images.gitee.com/uploads/images/2022/0529/192958_a42d9bbf_1004707.png "Snipaste_2022-05-29_19-29-52.png")

```cpp=
irt_int _layer_idx = -1;   //Port的层下标
std::vector<Rectangle<irt_int>> _shape_list; //Port包含那些形状

Rectangle<irt_int> box_rect();    // shape_list对应的boundingBox矩形
```

### 2.3.30 RTU.hpp

iRT模块自定义的整型类型，为了增加数据的表示范围，选择32为整型

```cpp=
using irt_int = int32_t;
#define IRT_INT_MIN INT32_MIN;
#define IRT_INT_MAX INT32_MAX;
```

### 2.3.31 RoutingLayer.hpp

绕线层的属性信息，如下图所示，有四层布线层，相邻层之间的布线方向是垂直的。

<img src="https://images.gitee.com/uploads/images/2022/0529/184021_fceb0907_1004707.png" width="45%">

```cpp=
irt_int _layer_idx;      // 布线层id
std::string _layer_name; // 层名
Direction _direction;    // 优先走线方向，见2.3.2
irt_int _min_width;      // 金属的最小工艺宽度
irt_int _min_area;       // 金属的最小工艺面积
RoutingTrack _routing_track;           // 绕线轨道属性，见2.3.32
std::vector<Spacing> _spacing_list;    // 当前布线层的间距规则
```

### 2.3.32 RoutingTrack.hpp

绕线轨道的属性信息
`<img src="https://images.gitee.com/uploads/images/2022/0529/120708_867dade1_1004707.png" width="60%">`

```cpp=
irt_int _start_line = 0; // 起始线
  irt_int _step_length = 0; // 步长
  irt_int _step_num = 0; // 步数
  irt_int _end_line = 0; // 终点线
  Direction _direction = Direction::kNone; // track方向，与对应层的方向一致
```

### 2.3.33 SigType.hpp

Net的信号类型

```cpp=
kNone = 0,
kSignal = 1, // 信号线网，设计中的大部分线网是这个类型
kPower = 2, // 供电线网
kGround = 3, // 接地线网
kClock = 4, // 时钟线网
kAnalog = 5, // 模拟信号线网
kReset = 6, // 复位信号线网
kScan = 7, // 扫描线网，用于检查芯片功能
kTieoff = 8 // 未知
```

### 2.3.34 Spacing.hpp

DRC检查规则之一，金属间距，range = min(Length(Rect)，Width(Rect))

<img src="https://images.gitee.com/uploads/images/2022/0529/190358_a8f91783_1004707.png" width="90%">

```cpp=
irt_int _min_range = 0; // range下界
irt_int _max_range = 0; // range上界
irt_int _min_spacing = 0; // 与此金属不发生违例的最小间距
```

### 2.3.35 Via.hpp

通孔属性信息

<img src="https://images.gitee.com/uploads/images/2022/0529/172705_446aa7c0_7702195.png" width="70%">

```cpp=
irt_int _via_idx;        // 通孔库下标
std::string _via_name;   // 通孔名
Enclosure _above_enclosure;    // 通孔上下帽子的信息，见2.3.18
Enclosure _below_enclosure;    // 同上
```

### 2.3.36 ViaNode.hpp

在版图中实例化的通孔

```cpp=
irt_int _id;        // 在线网中的node集合的下标
irt_int _via_idx;   // 通孔库的下标
irt_int _above_layer_idx;    // 上一层帽子的层下标
irt_int _below_layer_idx;    // 下一层帽子的层下标
Coordinate<irt_int> _real_coord;  // 通孔坐标
```

### 2.3.37 WireNode.hpp

在版图中实例化的金属线
![输入图片说明](https://images.gitee.com/uploads/images/2022/0529/184650_244a126e_1004707.png "Snipaste_2022-05-29_18-46-43.png")

```cpp=
irt_int _id;        // 在线网中的node集合的下标
irt_int _layer_idx; // 金属线所在层id
irt_int _width;     // 金属线宽度
Coordinate<irt_int> _first;    // 金属线起点坐标
Coordinate<irt_int> _second;   // 金属线终点坐标
WireNodeType _type; // 见下面
```

### 2.3.38 WireNodeType.hpp

![输入图片说明](https://images.gitee.com/uploads/images/2022/0529/191116_429be496_1004707.png "Snipaste_2022-05-29_19-11-10.png")

```cpp=
kNone = 0, //初始线段默认
kRouting = 1, //通过绕线产生的
kMinAreaPatch = 2, //通过最小面积产生的
```

## 2.4 子模块设计

所有子模块的架构与下图一致

### 2.4.1 ExternalInteractor

* 功能描述
  整个iRT与外部工具交互的接口，所有交互都在此封装，内部模块调用此接口。
  
  * 与iPA交互，在GR前确定pa点
  * 在region router与DRC频繁交互
  * 与STA交互，报告时序
* 数据结构
  
  * EIConfig.hpp
    ```cpp
    std::string _sta_workspace_path; // ExternalInteractor调用sta进行时序评估时，sta的工作路径
    std::string _sdc_file_path; // 设计约束文件路径
    std::vector<std::string> _lib_file_path_list; // lib文件路径
    std::string _temp_directory_path; // 临时文件夹
    ```
  * EIDatabase.hpp
    ```cpp
    // net_name -> pin_name -> 这个pin的pa_list
    std::map<std::string, std::map<std::string, std::vector<PAPoint>>> _net_pin_pa_map;
    ```
* 外部接口
  
  ```cpp
  // PA
   // 启动外部工具ipa来初始化_net_pin_pa_map数据
   void initPAPoint(PCL::iDB::IdbBuilder* idb_builder);
  
   // 双层检索，首先是net_name，之后是pin_name，返回的是线网（net_name）下的pin（pin_name）的所有pa点
   std::vector<PAPoint> getPAPoint(std::string net_name, std::string pin_name);
  
   // DRC
   // 初始化外部工具DRC
   void initDRC(PCL::iDB::IdbBuilder* idb_builder);
  
   /**
    * check_layer_set 需要检查的层 集合
    * region 检查的区域
    * rr_node_list 由rr node组成的wire和via集合
    */ 
   std::vector<pair<RRDRNode*, RRDRNode*>> checkDRC(std::set<irt_int> check_layer_set, Rectangle<irt_int> region,
                                                std::vector<RRDRNode>& rr_node_list);
   // Timing
   // 报告对应线网的时序
   void reportTiming(PCL::iDB::IdbBuilder* idb_builder, std::vector<Net>& net_list);
   void reportTiming(std::vector<Net>& net_list);
  ```

### 2.4.2 GridManager

* 功能描述
  
  * 构建网格模型
  * 初始化网格资源
  * 计算障碍物对网格的影响
* 数据结构
  
  * GMDatabase.hpp
    
    ```cpp=
    GridMap<ResourceNode> _plane_resource_map; // 平面资源图
      std::vector<GridMap<ResourceNode>> _space_resource_map; // 空间资源图
    ```
  * GMNet.hpp
    
    ```cpp=
    // GMNet主要用于记录上次更新的维度和存储上次更新的多叉树。
      MapDimension _last_update_dimension = MapDimension::kNone; // 上一次更新资源图的维度是（平面/空间）
      MTree<GMPoint> _point_tree; // 上一次更新到资源中的树
    ```
  * ResourceNode.hpp & ResourceType.hpp
    
    <img src="https://images.gitee.com/uploads/images/2022/0531/153103_e08762c8_1004707.png" width="90%">
* 外部接口
  
  ```cpp=
  // 更新资源图
  void updatePlaneMap(irt_int origin_net_idx, MTree<GRNode>& tree);
  void updateSpaceMap(irt_int origin_net_idx, MTree<GRNode>& tree);
  // 判断（x，y）是否为障碍
  bool isPlaneOBS(ResourceType resource_type, irt_int x, irt_int y);
  bool isSpaceOBS(ResourceType resource_type, irt_int x, irt_int y, irt_int layer_idx);
  // 获取（x，y）的剩余资源
  irt_int getPlaneRemaining(ResourceType resource_type, irt_int x, irt_int y);
  irt_int getSpaceRemaining(ResourceType resource_type, irt_int x, irt_int y, irt_int layer_idx);
  // 获得（x，y）的COST，在不同方向上
  double getPlaneCost(ResourceType resource_type, irt_int x, irt_int y);
  double getSpaceCost(ResourceType resource_type, irt_int x, irt_int y, irt_int layer_idx);
  // 检查二维资源与三维资源一致
  void checkResourceMap();
  // 清除资源图
  void clearResourceMap();
  // 报告资源图
  void reportResourceMap();
  ```

### 2.4.3 ResourceAllocator

* 功能描述
  
  * 估计线网需求
  * 构建迭代模型
  * 使用梯度下降求解资源分配
  * 将资源图转换为资源代价图
* 流程图
* 数据结构
* 算法设计
* 外部接口

### 2.4.4 PlaneRouter

* 功能描述
  
  * 通过iSR生成线网拓扑
  * 对拓扑解构进行两点布线
  * 对所有两点布线进行以下算法
    - L型布线
    - Z型布线
    - 内部三拐弯布线
    - 动态模式布线
    - U型布线
    - 外部三拐弯布线
    - A*布线
* 流程图
* 数据结构
* 算法设计
* 评价指标
* 外部接口

### 2.4.5 LayerAssigner

* 功能描述
  
  * 构建层分配树
  * 从层分配树根节点传播通孔数量
  * 从树叶子节点回溯通孔数量（动态规划）
  * 构建三维树
* 流程图
* 数据结构
* 算法设计
* 评价指标
* 外部接口

### 2.4.6 PinAccessor

* 功能描述
  
  * 计算 pin 的候选 pa 点，进行合法性检查，并获得合法的 via。
  * 计算不同 pin 的候选 pa 点之间的冲突关系。
  * 使用贪婪算法，计算每个 pin 最优的 pa 点。
  * 针对非 onGrid 类型的 pa 点生成 Jog。
* 流程图 `<br/>`

<img src="https://images.gitee.com/uploads/images/2022/0531/161347_5eb9bdb4_1004707.png" width="45%">

* 数据结构

#### 2.4.6.1 PAConfig.hpp

PinAccessor模块配置文件信息

#### 2.4.6.2 PADatabase.hpp

PinAccessor模块处理的数据信息

```cpp
std::vector<PANet> _pa_net_list;
```

#### 2.4.6.3 PADataManager.hpp

PinAccessor模块的数据管理器，从iRT顶层中转化并检查数据

```cpp=
PAConfig _pa_config;        // 保存PinAccessor模块所需的配置文件信息
PADatabase _pa_database;    // 保存PinAccessor模块处理的数据信息

// function
void inputConfig(Config* config);        // 转化顶层配置文件中的配置文件信息
void checkConfig();                      // 检查配置文件信息的合法性
void inputDatabase(Database* database);  // 转化iRTdatabase中的数据，并进行初始化
void wrap(Database* database);           // 具体地数据转化函数
void build();                            // 对转换后的数据进行初始化
```

#### 2.4.6.4 PANet.hpp

PinAccessor模块保存的线网对象

```cpp=
Net* _origin_net = nullptr;              // 当前PANet对应的iRT顶层database中的线网Net
std::string _net_name;                   // net名称  
std::vector<PAPinPoint> _pin_point_list; // net包含的pin对应的pa点数据
```

#### 2.4.6.5 PAPinPoint.hpp

pin包含的pa点信息

```cpp=
std::string _pin_name;                // 对应pin名称
std::vector<PAPoint> _pa_point_list;  // 名称为_pin_name的pin包含的pa
// ref
int _origin_pin_point_idx = -1;       // 当前PAPinPoint对应iRT中PinPoint
```

#### 2.4.6.6 PinAccessor.hpp

PinAccessor模块主要头文件

```cpp=
// self
static PinAccessor* pa_instance;    // PinAccessor模块实例对象
// config & database
PADataManager _pa_data_manager;     // PinAccessor模块数据管理器

void access(std::vector<Net>& net_list);        // 处理函数接口
void init(Config* config, Database* database);  // 数据初始化函数
void updateOriginPinPointList(PANet& pa_net);   // 更新处理后的数据到iRT的Net中
```

* 算法设计
  
  > 贪心算法：
  
  ```
  Input: Panel panel,  optimal PAPoint vector opt_pa_point_List
  
  get PAPort vector pa_port_list by panel 
  sort pa_port by non-increasing of pa'number
  Foreach pa_port in pa_port_list:
      opt_pa_point;
      min_conflict_cost = MAX_value;
      Foreach pa_point in pa_point_list:
    curr_conflict_cost = 0;
    curr_conflict_cost = calConflictWithPaOfOptPaPointList();
    if (min_conflict_cost > curr_conflict_cost) then
      min_conflict_cost = curr_conflict_cost;
      opt_pa_point = pa_point;
    end if
      end foreach
      sort pa_point_list by ascending order of total-cost
      insert opt_pa_point insert opt_pa_point
  end foreach
  ```
* 评价指标
* 外部接口

```cpp=
PinAccessor& PinAccessor::getInst(Config* config, Database* database)
{
  if (pa_instance == nullptr) {
    pa_instance = new PinAccessor(config, database);
  }
  return *pa_instance;
}

void PinAccessor::delInst()
{
  delete pa_instance;
  pa_instance = nullptr;
}

void PinAccessor::access(std::vector<Net>& net_list)
{
  double start;
  double end;

  start = COMUtil::microtime();

  irt_int batch_size = COMUtil::getBatchSize(net_list.size());

  for (size_t i = 0; i < net_list.size(); i++) {
    Net& net = net_list[i];
    access(net);

    if ((i + 1) % batch_size == 0) {
      end = COMUtil::microtime();
      Logger::info("PinAccessor", "Processed ", (i + 1), " nets: ", (end - start), "s");
    }
  }

  end = COMUtil::microtime();
  Logger::info("PinAccessor", "Processed ", net_list.size(), " nets: ", (end - start), "s");
}
```

### 2.4.7 GuideProcessor

* 功能描述
  
  - 对GR的Guide进行处理
    - 按Pin的位置进行切割
    - 去重
* 流程图 `<br/>`

<img src="https://images.gitee.com/uploads/images/2022/0531/161623_8e39d7a6_1004707.png" width="45%">

* 数据结构
* 算法设计
* 评价指标
* 外部接口

### 2.4.8 RegionManager

* 功能描述
  - 首先初始化用Rtree保存所有的Block和Pin作为静态数据
    - block采用DRC膨胀+融合
    - 需要的时候在拆分
  - 建立RModel，统一以RModel数据处理
  - 加入或者消除Wire或者Via的时候，转为RModel
  - 给定层和区域可以通过boost库快速获取相交的所有物体
* 流程图

<img src="https://images.gitee.com/uploads/images/2022/0531/161712_09c083a8_1004707.png" width="60%">

* 数据结构

#### 2.4.8.1 ChangeType.hpp

外部调用RM模块执行操作的类型

```cpp=
enum class ChangeType
{
  kNone = 0,   // 未初始化
  kAdd = 1,    // 向RM的rtree中添加元素
  kDel = 2     // 删除RM的rtree中的元素
};
```

#### 2.4.8.2 PreVia.hpp

计算某坐标的合法通孔时，保存相应信息

```cpp=
Coordinate<irt_int> _real_coord;    // 要打通孔的点的绝对坐标
  irt_int _below_layer_idx = -1;      // via的下层enclosure所在的层
  Direction _above_prefer_direction = Direction::kNone; // below_enclosure所在层的prefer direction
  Direction _below_prefer_direction = Direction::kNone; // above_enclosure所在层的prefer_direction
  std::vector<irt_int> _candidate_via_idx_list;         // _real_coord可打的via在via_lib中的下标的集合
```

#### 2.4.8.3 RMBlockage.hpp

RM模块下保存顶层Blockage数据，并保存膨胀后的数据

```cpp=
BoostBox _shape;                            // 未膨胀前blockage矩形保存为RTree使用的BoostBox类型
  irt_int _layer_idx = -1;                    // blockage所在层信息
  BlockageType _type = BlockageType::kNone;   // 当前RMBlockage保存得到原始blockage所属的类型
  irt_int _min_spacing = -1;                  // _layer_idx层对应得到最小违例间距
  BoostBox _enlarged_shape;                   // 原始blockage矩形膨胀_min_spacing后的结果
```

#### 2.4.8.4 RMConfig.hpp

RM模块所需配置信息

#### 2.4.8.5 RMDatabase.hpp

RM数据信息

```cpp=
std::vector<RoutingLayer> _routing_layer_list;              // 布线层信息
  std::vector<std::vector<RMBlockage>> _layer_blockage_list;  // 每层对应得到blockage list
  std::vector<Via> _via_lib;                     // 通孔库   
  std::vector<std::vector<Via>> _layer_via_lib;  // blow_enclosure所在层相同的via组成list，并保存所有list
  std::vector<RMNet> _rm_net_list;               // 保存RM要处理的所有线网
  std::vector<bgi::rtree<StaticBox, bgi::quadratic<16>>> _static_region_map;    // 每层blockage_list构成的rtree的列表
  std::vector<bgi::rtree<DynamicBox, bgi::quadratic<16>>> _dynamic_region_map;  // 每层pin wire via构成的rtree的列表
```

#### 2.4.8.6 RMModel.hpp

传递外部数据和返回RM结果数据的载体

```cpp=
irt_int _net_idx = -1;              // RM要处理的线网id
  std::vector<RMWire> _rm_wire_list;  // RM要处理的金属线的list
  std::vector<RMVia> _rm_via_list;    // RM要处理的通孔的list
  std::map<irt_int, std::vector<RMNetShape>> _net_shape_list_map;  // 线网id与线网components的map
  std::map<void*, std::vector<PreVia>> _pre_via_list_map;          // 要确定具体通孔的对象和所要确定的通孔

  // 外部接口
  void addWire(Segment<Coordinate<irt_int>> segment, irt_int layer_idx, irt_int wire_width = -1, irt_int obj_id = -1) // 向rtree中添加金属线信息
  void addPreVia(void* source, Coordinate<irt_int> real_coord, irt_int below_layer_idx, Direction above_prefer_direction = Direction::kNone,
                 Direction below_prefer_direction = Direction::kNone)                  // 向rtree中添加预通孔信息
  void addVia(Coordinate<irt_int> real_coord, irt_int below_layer_idx, irt_int via_idx) // 向rtree中添加通孔信息
```

#### 2.4.8.7 RMNet.hpp

RM保存的顶层线网数据

```cpp=
std::vector<Port> _port_list;                                   // 组成线网的pin shape
  std::map<irt_int, std::vector<RMNetShape*>> _obj_id_shape_map;  // 线网id与线网components矩形的map
```

#### 2.4.8.7 RMNetShape.hpp

RM中保存线网components(pin/via/wire)矩形的信息

```cpp=
BoostBox _shape;     // 线网component原始shape矩形，保存成boost类型shape
  irt_int _layer_idx;  // 线网component所在层信息
  irt_int _min_spacing = -1; // _layer_idx层对应的最想间距
  BoostBox _enlarged_shape;  // 对线网component原始shape矩形，使用_min_spacing进行膨胀后矩形
  RMNetShapeType _type = RMNetShapeType::kNone;  // 当前线网component对应的类型
```

#### 2.4.8.8 RMNetShapeType.hpp

RM中线网component的类型，主要包括pin/via/wire类型

```cpp=
enum class RMNetShapeType
{
  kNone = 0,   // 未初始化
  kPin = 1,    // 线网component是pin类型
  kWire = 2,   // 线网component是通孔类型
  kVia = 3     // 线网component是金属线类型
};
```

#### 2.4.8.9 RMVia.hpp

RM中保存顶层通孔信息

```cpp=
Coordinate<irt_int> _real_coord;  // 当前通孔的绝对坐标
  irt_int _via_idx = -1;            // 当前通孔在通孔库(via_lib)中的下标
```

#### 2.4.8.10 RMWire.hpp

RM中保存金属线(wire/segment)信息

```cpp=
Segment<Coordinate<irt_int>> _segment;  // 当前金属线对应的线段segment(只有起点和终点)
  irt_int _layer_idx = -1;    // 当前金属线所在层信息
  irt_int _wire_width = -1;   // 当前金属线所在层的最小线宽
```

* 算法设计
  
  [R-Tree 算法介绍连接,点击查看](https://www.boost.org/doc/libs/1_65_1/libs/geometry/doc/html/geometry/spatial_indexes/introduction.html)
* 评价指标
* 外部接口

```cpp=
// 获得指定层layer和其上区域region内的矩形，包括pin/via/wire/blockage
  std::map<irt_int, std::vector<Rectangle<irt_int>>> getRectMapInRegion(irt_int layer_idx, Rectangle<irt_int> region);
  // 获得指定层layer和其上区域region内的矩形，只包括blockage和pin的shape
  std::map<irt_int, std::vector<Rectangle<irt_int>>> getBlockageAndPin(irt_int layer_idx, Rectangle<irt_int> region);
  bool addRecord(RMModel& rm_model);    // 通过rm_model向RM的rtree中添加信息
  bool delRecord(RMModel& rm_model);    // 通过rm_model向RM的rtree中删除信息
  bool getSolution(RMModel& rm_model, bool ignore_checking_self = false); // 返回合法性检查结果
```

### 2.4.9 TrackAssignment

* 功能描述
  
  - 遍历所有Net,判断是否为Local_net，如果是的话按照HV或者SR生成主干线段
  - 抽取Guide线段,如果一个区域包含多pin，生成局部local net主干线段
  - 上述线段存入对应Panel
  - 开始TA，首先进行ILP，如果ILP超时或者无解，采用贪心算法
  - 结果进行合并去重，写回NET
* 流程图 `<br/>`

![输入图片说明](https://images.gitee.com/uploads/images/2022/0531/161838_67162c28_1004707.png "Snipaste_2022-05-31_16-18-22.png")

* 数据结构

#### 2.4.9.1 AssignTrackType.hpp

线网Track分配采用Greedy还是ILP

```cpp=
enum class AssignTrackType
{
  kGreddy = 0,
  kILP = 1
};
```

#### 2.4.9.2 LocalRoutingType.hpp

LocalNet的生成方式采用SR还是HV树

```cpp=
enum class LocalRoutingType
{
  kHV = 0,
  kSR = 1
};
```

#### 2.4.9.2 PortSortType.hpp

排序方式

```cpp=
enum class PortSortType
{
  kPortPriority = -1, //按照port的形状排序，
  kPortPANums = 0,    //按照Port上的pa数量排序
  kDrcPriority = 1,   //按照DRC的数量排序
};
```

#### 2.4.9.2 SegMSortType.hpp

线段排序方式

```cpp=
enum class SegMSortType
{
  kTrackAssigner = 0, //按照 loclanet优先，然后线段长的优先排
  kPriority = 1,    // 按照本身的优先级顺序排
  kXcoor = 2,
  kYcoor = 3
};
```

#### 2.4.9.2 TAConfig.hpp

TA的配置信息

```cpp=
private:
  double _adjacent_segment_ratio = 0; //GR上相邻的线段的权重
  double _connect_pin_ratio = 0;     //线网中附件Pin的权重
  double _pin_obs_ratio = 0;         //线网中其他线网Pin的权重
  double _pa_cost = 0;               //线网中PA的权重
  double _overlap_ratio = 0;        //线网重叠或者block重叠的权重
  double _drc_ratio = 0;            //产生DRC这里一般指代Spacing的权重
```

#### 2.4.9.2 TADatabase.hpp

TA的模块顶层数据

```cpp=
private:
  std::map<irt_int, std::set<irt_int>> _region_net_connect;  //待补充
  std::vector<bgi::rtree<BoostBox, bgi::quadratic<16>>> _layer_block_tree; //每层的RTree block
```

#### 2.4.9.2 TANet.hpp

TA模块的Net

```cpp=
private:
  std::vector<PAPoint> getPAPointList();    //得到TANet的所有Pin的最好的PA_list
  // object
  irt_int _object_id = 0;  //Net内部的对象 id集合
  std::vector<PinPoint> _pin_point_list; // 每个Pin生成的
  std::vector<std::vector<irt_int>> _connect_node_id_list;//每个线相邻的线段有哪些
  std::vector<TASegment> _topo_node_list;  //临时线段，用于存储，名字没取对
  std::vector<TASegment> _ta_node_list; //包含那些线段
```

#### 2.4.9.2 TAPanel.hpp

```cpp=
private:
  irt_int _priority = -1;                   //排序优先级
  bool _is_split_seg = false;               //panel是否存在需要split的线段
  RoutingTrack _panel_track;                //panel包含的Track信息
  bgi::rtree<BoostBox, bgi::quadratic<16>> _panel_block_tree;  //RTree存储block
  bgi::rtree<std::pair<BoostBox, irt_int>, bgi::quadratic<16>> _panel_pa_tree; //RTree存储pa
  bgi::rtree<std::pair<BoostBox, irt_int>, bgi::quadratic<16>> _panel_jog_tree;//RTree存储pa模块的补丁
```

#### 2.4.9.2 TASegment.hpp

TA内部使用的线段

```cpp=
private:
  irt_int _track_id = -1;                       // 线段位于那个track 条数上
  Coordinate<irt_int> _first;                   //线段起始点
  Coordinate<irt_int> _second;                 //线段终点
  std::vector<PAPoint> _adj_pa_point_list;     //线段和那些pa相邻接
  bool _is_over_lap = false;                //是否与其他线网或者block重叠
```

#### 2.4.9.2 GlobalFuction.hpp

求解函数

```cpp=
public:
      void sloveIlpInstance(ILPInstance* _ilp_instance); //ILP求解
private:
    //求解器核心函数，内部求解采用指针
    void GRBSolve(ILPInstance* _ilp_instance, const std::vector<irt_int>& lens, const std::map<irt_int, irt_int>& type_code_To_type_id);
```

#### 2.4.9.2 ILPInstance.hpp

求解数据类

```cpp=
class TRACK_RAW
{
 private:
  irt_int _raw_id;          //指代哪一个panel
  irt_int _start_time;       // 线段起始位置
  irt_int _end_time;        //线段终止位置
  irt_int _pos;            //暂时没用到
};   

class JOB
{
private:
  irt_int _id = -1;                // job在Instancel中Job集合中的下标
  JobType _type = JobType::kNone;  // SEG | PA | BLOCK
  irt_int _type_code = -1;         // 线网下标
};

class ILPInstance
{
private:

  std::string _input_file_name = "";   // 用于外部运行读取文件
  irt_int _track_num = -1;           //包含track条数
  std::vector<JOB*> _all_jobs_list;  //包含pa list和seg list
  std::unordered_map<irt_int, std::set<JOB*>> _trackId_to_PAs_map; //每条Track上对应的东西
  std::unordered_map<irt_int, std::set<JOB*>> _trackId_to_blocks_map; //每条Track上对应的东西
  std::unordered_map<irt_int, std::set<JOB*>> _trackId_to_segs_map;  // result
};
```

#### 2.4.9.2 JobType.hpp

Job的类型，从什么转过来的job

```cpp=
enum class JobType
{
  kNone = -1,
  kSeg = 0,
  kPa = 1,
  kBlock = 2,   
  kTypeNum = 3    //好像没用到，待确认    
};
```

#### 2.4.9.2 TrackAssigner.hpp

TA求解类

```cpp=
public:
  static TrackAssigner& getInst(Config* config = nullptr, Database* database = nullptr);
  static void delInst();
  //外部使用 ILP还是Greedy，来进行Track分配
  void assignTrack(std::vector<Net>& origin_net_list,AssignTrackType assign_type);

private:
  TADataManager* _ta_manager;           //模块的数据处理器
  RegionManager* _region_manager;      //用到的区域管理器
```

* 算法设计
  以下是内联区域的LocalRegion产生线段图示
  ![输入图片说明](https://images.gitee.com/uploads/images/2022/0530/193835_312ac088_7702195.png "屏幕截图.png")
  以下是Guide抽线图示
  ![输入图片说明](https://images.gitee.com/uploads/images/2022/0525/171936_bc8f1de9_7702195.png "屏幕截图.png")

```cpp=
###生成线段，判断是否为Local Net以及Net是否存在内联Local Region（有多Pin在同一个Region）
InPut:Net set N（s)，RoutingLayerTrack set T(s)
Foreach net In N(s)
    if(LocalNet()){
        genIntraGcellNet(HV or SR,net);
    }else{
        //内联区域产生Local Seg
       genIntraGcellNet（HV or SR,net)
       //guide 抽线
       genIntraGcellNet（net)
    }
    duplicateSegList（net)
    //存储相邻关系
    init_net_connected_relationship(ta_net);
End Foreach
```

```cpp=
### AssignTrack的时候采用Greedy
贪心：
  Input：Panel p,seg set S(p),and track set T(p)
  Sort S(p) based on their lengths in a non-increasing ordere
  Foreach seg in S(p) traversed by their sorted order
    minCost = +00
    Foreach track t in T(p)
      wlCost = calculateWirelengthCost(seg,t)
            paCost = calculatePaCost(seg,t)
      otherPaCost = calculateOtherPaCost(seg,t)
      overlapCost = calculateOverlapCost(seg,t)
      blockCost = calculateBlocakgeCost(seg,t)
      Cost = wlCost*α +paCost  *j + otherPaCost * m + overlapCost*β+ blockCost*k
      If(cost < minCost) then
        minCost = cost
              minCostTrack = t
            End if
          End foreach
          Assign seg to minCostTrack
  End foreach
  函数解释
  calculateWirelengthCost(seg,t)暂时可以不加这个cost
  calculatePaWireLengthCost(seg,t)
      seg想和同类型的pa近，算的是seg终点和pa点的二维距离，这部分数据需要预处理一下
  calculateOtherPaCost(seg,t)
      如果seg的矩形和panel的pa_tree矩形存在相交且不是本类型，增加cost,如果是本类型的减少cost,cost算的是重叠长度
  calculateOverlapCost(seg,t)
      如果seg的矩形和panel的seg_tree矩形存在相交且不是本类型，增加cost
  calculateBlocakgeCost(seg,t)
      如果seg的矩形和panel的block_tree矩形存在相交，增加cost，算的是重叠长度大小
  目前α为0.5 ，j为1，m为 50 ，β为100，k为10000
```

* 评价指标
* 外部接口

### 2.4.10 RegionRouter

* 功能描述
  
  - 首先生成区域拓扑
    - 遍历Grid区域生成All Layer Router，从 `RRouterLayerList` 中获得拓扑数据存储的位置
    - 遍历Router中的每条subnet：
      - 获得Key Point
      - 根据Key Point，调用SR获得坐标间的拓扑关系
      - 斯坦纳点分配层信息
      - 为跨层的点生成Via
  - 从第二层开始,每两层开始绕线
    - 按区域遍历
      - 建立cost_map,RM初始化
      - 获取拓扑数据
      - 绕线
        - 根据当前布线资源，移动将不合法的拓扑点
        - Cost_map更新
        - 模式布线，A*
        - 如果不连通则强制绕线
    - 按区域检测DRC，是否拆线重布
      - 选择Cost的最大Net拆线
      - 反馈Cost给Cost_map
      - 重绕线
      - 迭代若干次后还是不行则按密度扩区域
* 流程图 `<br/>`

<img src="https://images.gitee.com/uploads/images/2022/0531/164641_99baadb4_1004707.png" width="60%">

* 数据结构

#### 2.4.8.1 GdsType.hpp

输出的GDS的主要输出类型

```cpp=
enum class GdsType
{
  kInputNode = -1,    //是否是自定义输出Node
  kOriginNode = 0,      //输出net的originNode
  kCurrRoutingNode = 1,    //输出net的CurrRoutingNode
  kCurrDrcNode = 2,    //输出net的CurrDrcNode
  kBestRoutingNode = 3,    //输出net的BestRoutingNode
  kBestDrcNode = 4,    //输出net的BestDrcNode
};
```

#### 2.4.8.1 GridCostType.hpp

格点对应的cost的类型

```cpp=
enum class GridCostType
{
  kViaCost = 0,     //打via的vost
  kAroundCost = 1,  //辐射出来的cost
  kDrcCost = 2,    //产生DRC的cost
  kGridCost = 3,   //格点本身的Cost
};
```

#### 2.4.8.1 ObsType.hpp

障碍物类型

```cpp=
enum class ObsType
{
  kNone = 0,
  kHObstacle = 1,  //水平方向的障碍物
  kVObstacle = 2,  //垂直方向的障碍物
  kObstacles = 3,  //全障碍
};
```

#### 2.4.8.1 ResourceType.hpp

Astar的cost

```cpp=
enum class ResourceType
{
  kNone = 0,
  kEast = 1,   //左边
  kWest = 2,   //右边
  kSouth = 3,  //下边
  kNorth = 4, //上边
  kVia = 5
};
```

#### 2.4.8.1 RoutingMode.hpp

绕线模式

#### 2.4.8.1 RRConfig.hpp

RR的配置信息

```cpp=
private:
  double _grid_cost = 0;       //格点csot
  double _around_cost = 0;    //格点散发的cost
  double _via_cost = 0;        //格点的via cost
  double _drc_cost = 0;        //格点的drc Cost
```

#### 2.4.8.1 RRDRNode.hpp

RR的模块顶层数据

```cpp=
private:
  DRNodeType _type = DRNodeType::kNone;                  //结点类型
  DRNodeCategory _category = DRNodeCategory::kNone;       //产生的类别
  std::vector<Coordinate<irt_int>> _intersect_point_list;  //TOPO？
```

#### 2.4.8.1 RRGridNode.hpp

RR的格点内的结点

```cpp=
private:
  std::vector<irt_int> _via_idx_list;    //可以放置的合法via类型
```

#### 2.4.8.1 RRNet.hpp

RR的格点内的结点

```cpp=
private:
  std::vector<RRDRNode> _ta_node_list;    //ta的结果
  double _priority = 0;         //排序的优先级
  std::vector<RRDRNode> _routing_node_list;  //绕线结果
```

#### 2.4.8.1 RRouter.hpp

绕线的核心类，每次绕线一个RRouter

```cpp=
public:

//待补充
  std::map<irt_int, RRSubNet*> getSubNetMap();
//待补充
  void buildSubNetNodeIdx();

 private:
  RRouterLayerType _layer_type = RRouterLayerType::kNone;  //那几层数据合并的
  irt_int _layer_idx = -1;    //可能是某一层的RRouter
  std::pair<irt_int, irt_int> _layer_idx_pair = std::pair<irt_int, irt_int>(-1, -1); //起始层 -> 终止层
  RRGridMap _grid_map;    //区域对应的cost map
  std::vector<RRSubNet> _subnet_list;  //区域的sub net的集合
  // temp data
  std::map<irt_int, std::vector<Guide>> _net_guide_map; //区域内Net对应的矩形
  std::map<irt_int, std::vector<Guide>> _net_drc_map;   //区域内net的DRC对应的矩形
  bgi::rtree<std::pair<BoostBox, irt_int>, bgi::quadratic<16>> _net_below_tree; //下层RTree
  bgi::rtree<std::pair<BoostBox, irt_int>, bgi::quadratic<16>> _net_above_tree;//上层RTree
  std::map<Coordinate<irt_int>, irt_int, CmpCoordinateXASC<irt_int>> _rel_pa_net; // the map between relative pa_coord and it's net
```

#### 2.4.8.1 RRouterLayerList.hpp

```cpp=
using NetTopoMap = std::map<irt_int, std::vector<RRDRNode>>;

public:
//根据区域id获取ToPo
  NetTopoMap& get_topo_map(irt_int grid_id);
//得到区域所在的区域的ToPo
  std::vector<NetTopoMap*> get_topo_map_list(const Rectangle<irt_int>& region_shape);
//得到指定层指定线网指定区域的TOPO
  std::map<Coordinate<irt_int>, Coordinate<irt_int>, CmpCoordinateXASC<irt_int>>& get_topo_net_cor_map(irt_int grid_id, irt_int net_id,
                                                                                                       irt_int layer_idx);
//结点过长需要切割
  std::vector<RRDRNode> splitDRNode(RRDRNode& source_seg, irt_int grid_size, RRNet& rr_net);

 private:
  std::vector<RRouterLayer> _rrouter_layer_list; //包含那些rrouter
  std::vector<NetTopoMap> _topo_map_list;       //可能临时数据，待补充
  std::vector<std::map<irt_int, std::vector<std::map<Coordinate<irt_int>, Coordinate<irt_int>, CmpCoordinateXASC<irt_int>>>>>
      _topo_net_cor_map;//可能临时数据，待补充
};
```

#### 2.4.8.1 RRouterLayerType.hpp

那几层构建RRouter

#### 2.4.8.1 RRouterSortType.hpp

RRouter排序的类型，不同类型对应不同排序规则

#### 2.4.8.1 RRPoint.hpp

```cpp=
public:
//如果point是AP点转换来的 ，可能需要打Jog
  std::vector<DRNode> getJogList();
  irt_int manhattanDistance(const RRPoint& other) const;

private:
  irt_int _pin_idx = -1;               //对应的Pin下标 如果是PA转换来的
  bool _b_pin_point = false;        //  是不是pa转换来的
  bool _b_key_point = false;         //  是不是关键点，斯坦纳点不是关键点
  Direction _dir = Direction::kNone;    //原来这个转换过来的点在什么方向
  PAPointType _pin_point_type = PAPointType::KNone;    //原来这个点如果是ap点 是属于什么类型 
  std::vector<irt_int> _optional_via_idx_list; //这个点如果是ap点，原来推荐的via有哪几种
  std::map<Coordinate<irt_int>, std::vector<DRNode>, CmpCoordinateXASC<irt_int>> _coord_jog_map; //如果打jog打什么样子的jog
```

#### 2.4.8.1 RRSubNet.hpp

```cpp=
public:
//待补充
  std::pair<irt_int, irt_int> getBeforeRRLayerRange() const;

 private:
  // origin
  std::vector<Pin> _origin_pin_list;    //包含那些Pin
  std::vector<PinPoint> _origin_pin_point_list; //包含那些Pin的抽象对象
  std::vector<RRDRNode> _origin_node_list;  //TA Node作为Origin node
  std::vector<RRPoint> _pa_list;          //有哪些pa lsit
  double _priority = 0;                  //排序优先级
  irt_int _region_id = -1;               //对应的RRouter id
  irt_int _number_disconnect = 0;       //多少为连通的
  std::vector<RRDRNode> _topo_node_list;  //构建的TOPOList
  std::vector<RRDRNode> _current_routing_node_list; //当前绕线的Node list
  std::vector<RRDRNode> _best_routing_node_list;  // 当前最佳的Node List
  // drc data  
  std::vector<RRDRNode> _curr_drc_node_list;    //当前的DRC List
  std::vector<RRDRNode> _best_drc_node_list;    //最好的DRC List

  // function
//以矩形为边界七个线段
  bool splitSegInRectangle(RRDRNode& source_real_node, std::vector<RRDRNode>& target_segment_list, const irt_int layer_idx,
                           Rectangle<irt_int>& region, RRNet* rr_net);
//待补充
  bool routerContainsVia(ViaNode& source_via, const irt_int layer_idx, Rectangle<irt_int>& region);
```

#### 2.4.8.1 RRSubNetSortType.hpp

RRSubNet，不同类型对应不同排序规则

```cpp=
enum class RRSubNetSortType
{
  kDesity = 0,
  kDrc = 1,
};
```

#### 2.4.8.1 RRWireNode.hpp

RR模块里面的WireNode

```cpp=
public:
//待补充
  RRPoint& getNearestEndPoint(const Coordinate<irt_int>& coord);
//待补充
  RRPoint& getFarthestEndPoint(const Coordinate<irt_int>& coord);
//待补充
  std::pair<RRPoint&, RRPoint&> getAscendEndPointsByDistanceTo(const Coordinate<irt_int>& coord);
//待补充
  std::pair<Coordinate<irt_int>, Coordinate<irt_int>> getAscendEndCoordsByDistanceTo(const Coordinate<irt_int>& coord) const;
//待补充
  Coordinate<irt_int> nearestEndCoord(const Coordinate<irt_int>& coord) const;
//待补充
  Coordinate<irt_int> farthestEndCoord(const Coordinate<irt_int>& coord) const;
//待补充
  void clearKeyPointStatus();
//待补充
  bool contain(const Coordinate<irt_int>& coord) const;

 private:
  RRPoint _first; //起点的point
  RRPoint _second;//终点的point
```

#### 2.4.8.1 RegionRouter.hpp

RR模块求解类

```cpp=
public:
//构建全局TOPO
  void topoBuilder();
//区域绕线
  void areaRouter();
//后处理
  void postProcess();

 private:
  // self
  RRDataManager* _rr_manager = nullptr;  //数据管理中心
  idrc::DRC* _drc;     //DRC模块
  // module ptr
  RegionManager* _region_manager; //区域管理器
  // temp
  irt_int _violation_shape_num = 0;    //违例数量
  irt_int _enlarge_shape_num = 0;    //解决违例扩充的数量
  RRouter* _curr_router; //debug用的
```

* 子模块
  * RegionGridMap.cpp
* 算法设计

```cpp=
### RR绕线
Input：Layer set L(s)
Foreach layer in L(s)
    input rrouter_layer_list in buildRRouterListForTwoLayers(layer,layer + 1)
    updateBestOrOriginToCurrRRouterList(rrouter_layer_list)
    sortRRouterList(rrouter_list, RRouterSortType::kDesity);
    routeRouterList(rrouter_list);
    sortRRouterList(rrouter_list, RRouterSortType::kDrc);
    ripupRRouterList(rrouter_list);
    updateCurrToBestRRouterList(rrouter_list);
    writeBackRRouterListData(rrouter_list);
End foreach
函数解释
 updateBestOrOriginToCurrRRouterList(rrouter_layer_list)
    将originOrBest（如果Best不为空则采用Best）赋值到Curr中
```

```cpp=
区域内拆线策略

  拆一个绕一个，迭代可行高，可以消除net顺序的影响
      评价一个net目前绕线的结果好不好，并且做为整体拆线的评估
                  Evil_cost = α*drc_grid_cost + β*vias_cost+ γ*wire_grid_cost,越大越不好
                  drc_grid_cost:drc_cost*drc占据的grid个数，wire_grid_cost：wire占据的grid个数
                  prefer dir为1，no prefer为20，via为30，drc为50
                  α，β，γ的值分别为[1.0-3.0],0.1,1
      
                  待考虑：是否考虑加入一个随机变量让贪心随机一点，不陷入局部优化或者循环 ？ 暂未加入
```

* 评价指标
* 外部接口

### 2.4.11 SpaceRouter

* 功能描述
  
  - 按照DRC选择Net目标
  - 扩区域
  - 建立三维图
  - 三维Astart
  - 同RegionRouter拆线迭代策略
* 流程图
* 数据结构
* 算法设计
* 评价指标
* 外部接口

## 3. 接口设计

### 3.1 外部接口

> *包括用户界面、软件接口。*

```c++
idrc::DRC* _drc;
```

（1）初始化DRC

```c++
void initDRC(PCL::iDB::IdbBuilder* idb_builder);
void ExternalInteractor::initDRC(PCL::iDB::IdbBuilder* idb_builder)
{
  _drc = new idrc::DRC();
  _drc->initTechFromIDB(idb_builder);
  _drc->initCheckModule();
}
```

## 4. DEF输出

![输入图片说明](https://images.gitee.com/uploads/images/2022/0525/170713_cc85bc74_7702195.png "屏幕截图.png")

## 5. TO BE DONE

### 5.1 疑难问题

> *描述重点难点问题* ；
> 
> *说明在开发过程中遇到的问题，以及解决方法。例如：方法的选择、参数的处理、需要说明的其他具体问题。如果有不能正常工作的模块，说明具体情况，猜测可能的原因。*

### 5.2 待研究

> *待研究问题；*

